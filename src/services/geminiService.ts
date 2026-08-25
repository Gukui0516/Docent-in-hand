import { GoogleGenAI } from '@google/genai';
import { POI, Character } from '../types/docent';
import { RAGService } from './ragService';

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = 
      import.meta.env.VITE_GEMINI_API_KEY || 
      (typeof window !== 'undefined' ? localStorage.getItem('DOCENT_GEMINI_API_KEY') || '' : '');

    this.modelName = 
      import.meta.env.VITE_GEMINI_MODEL || 
      (typeof window !== 'undefined' ? localStorage.getItem('DOCENT_GEMINI_MODEL') || 'gemini-3.7-flash' : 'gemini-3.7-flash');

    if (this.apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.warn('Gemini client init error:', err);
      }
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('DOCENT_GEMINI_API_KEY', this.apiKey);
    }
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getModelName(): string {
    return this.modelName;
  }

  public setModelName(model: string) {
    this.modelName = model.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('DOCENT_GEMINI_MODEL', this.modelName);
    }
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Pure RAG-Driven Live Story Generation via Gemini
   */
  public async generateSnackStory(
    poi: POI,
    character: Character,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; ttftMs: number; totalLatencyMs: number; references?: string[] }> {
    const startTime = performance.now();
    let ttftMs = 0;

    const ragContext = RAGService.getRAGContext(poi, character);

    if (!this.client || !this.apiKey) {
      const needKeyMsg = `⚠️ 실시간 RAG 생성을 위해 Gemini API 키가 필요합니다. 상단 설정에서 Gemini API Key를 입력해 주시면 한국학중앙연구원 학술 데이터베이스를 기반으로 ${character.name}의 실시간 맞춤형 도슨트가 생성됩니다.`;
      if (onChunk) onChunk(needKeyMsg);
      return {
        text: needKeyMsg,
        ttftMs: 50,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    }

    try {
      const prompt = RAGService.buildDeepStoryPrompt(poi, character);

      const responseStream = await this.client.models.generateContentStream({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.2,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (!ttftMs) {
          ttftMs = Math.round(performance.now() - startTime);
        }
        const text = chunk.text || '';
        fullText += text;
        if (onChunk) {
          onChunk(text);
        }
      }

      return {
        text: fullText,
        ttftMs: ttftMs || 300,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    } catch (err: any) {
      console.error('Gemini API stream error:', err);
      const errMsg = `⚠️ 실시간 RAG 스토리 생성 중 오류가 발생했습니다: ${err.message || err}`;
      if (onChunk) onChunk(errMsg);
      return {
        text: errMsg,
        ttftMs: 150,
        totalLatencyMs: Math.round(performance.now() - startTime),
        references: ragContext.references
      };
    }
  }

  /**
   * Pure RAG-Driven Live Interactive Chat (Tiki-taka) via Gemini 1.5 Flash
   */
  public async sendChatMessage(
    poi: POI,
    character: Character,
    userMessage: string,
    history: { sender: 'user' | 'model'; text: string }[],
    onChunk?: (text: string) => void
  ): Promise<{ text: string; ttftMs: number; totalLatencyMs: number }> {
    const startTime = performance.now();
    let ttftMs = 0;

    const ragContext = RAGService.getRAGContext(poi, character);

    if (!this.client || !this.apiKey) {
      const needKeyMsg = `⚠️ 실시간 대화를 위해 Gemini API Key가 필요합니다.`;
      if (onChunk) onChunk(needKeyMsg);
      return {
        text: needKeyMsg,
        ttftMs: 50,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }

    try {
      const contents = history.slice(-6).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{
          text: `<context>
[현재 장소]: ${poi.name}
${ragContext.groundedPromptContext}
</context>

<user_query>
"${userMessage}"
</user_query>

<instruction>
위 <context> 자료에 엄격히 근거하여 <user_query>에 대한 정확한 사실 답변을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두) 없이 질문에 대한 팩트 답변으로 즉시 시작하십시오.
- [필수] 자료에 없는 인물, 연도, 사건을 지어내지 말고 오직 제공된 지식베이스 범위 내에서만 답변하십시오. 자료에 없다면 '관련 기록이 확인되지 않습니다'라고 정직하게 답하십시오.
- [필수] 장소의 실제 관람 환경/보존 상태(옛 터, 미정비 구역 여부 등)를 사실 그대로 정확히 전달하십시오.
- [필수] 주어-서술어가 명확한 완성형 문장으로 200~300자 내외로 사실에 입각하여 답변하십시오.
</instruction>`
        }]
      });

      const responseStream = await this.client.models.generateContentStream({
        model: this.modelName,
        contents,
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.2,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (!ttftMs) {
          ttftMs = Math.round(performance.now() - startTime);
        }
        const text = chunk.text || '';
        fullText += text;
        if (onChunk) {
          onChunk(text);
        }
      }

      return {
        text: fullText,
        ttftMs: ttftMs || 300,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    } catch (err: any) {
      console.error('Gemini live chat error:', err);
      const errMsg = `⚠️ 실시간 답변 생성 중 오류가 발생했습니다: ${err.message || err}`;
      if (onChunk) onChunk(errMsg);
      return {
        text: errMsg,
        ttftMs: 150,
        totalLatencyMs: Math.round(performance.now() - startTime)
      };
    }
  }
}

export const geminiService = new GeminiService();
