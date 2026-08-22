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
          text: `[현재 장소]: ${poi.name}
${ragContext.groundedPromptContext}
[관광객 질문]: "${userMessage}"
위 질문에 대해 서두(인사말)와 종두(맺음말)를 절대로 출력하지 마세요. 장소의 실제 관람 가능 여부나 정비 상태를 팩트대로 정확히 전달하고, 어려운 단어나 과도한 숫자 없이 150~250자 내외로 명확하게 답변하세요.`
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
