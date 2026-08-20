import { GoogleGenAI } from '@google/genai';
import { POI, Character } from '../types/docent';
import { RAGService } from './ragService';

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = 
      import.meta.env.VITE_GEMINI_API_KEY || 
      (typeof window !== 'undefined' ? localStorage.getItem('DOCENT_GEMINI_API_KEY') || '' : '');

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

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Pure RAG-Driven Live Story Generation via Gemini 1.5 Flash
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
      const needKeyMsg = `⚠️ 실시간 RAG 생성을 위해 Gemini API 키가 필요합니다. 상단 설정에서 Gemini API Key를 입력해 주시면 한국학중앙연구원 학술 데이터베이스를 기반으로 ${character.name}의 실시간 3막 도슨트가 생성됩니다.`;
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
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.7,
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
[관광객의 질문]: "${userMessage}"
위 질문에 대해 당신(${character.name})의 1인칭 페르소나와 품격을 지키며, 제공된 RAG 학술 팩트에만 근거하여 100% 매끄럽고 유려한 표준어 구술체로 200~350자 내외로 명쾌하게 답변해 주세요.`
        }]
      });

      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-1.5-flash',
        contents,
        config: {
          systemInstruction: character.systemPrompt,
          temperature: 0.7,
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
