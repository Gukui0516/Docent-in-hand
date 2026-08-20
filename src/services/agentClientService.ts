import { POI, Character } from '../types/docent';
import { GeminiService } from './geminiService';

export interface AgentStatusEvent {
  layer: number;
  agent: string;
  step: 'researching' | 'progress' | 'storytelling' | 'answering';
  message: string;
}

export interface ResearchCompleteEvent {
  targetPOI: string;
  folkloreCount: number;
  historyCount: number;
  geologyCount: number;
  sources: string[];
}

export class AgentClientService {
  private static backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  private static geminiFallback = new GeminiService();

  /**
   * Streams 1st person docent story from the 2-Layer Multi-Agent Backend
   */
  public static async streamDocentStory(
    poi: POI,
    character: Character,
    onStatus: (status: AgentStatusEvent) => void,
    onToken: (token: string) => void,
    onComplete: (fullText: string, sources: string[]) => void,
    onError: (err: string) => void
  ): Promise<void> {
    const url = `${this.backendUrl}/api/agent/stream-story`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poiName: poi.name,
          characterId: character.id,
          coordinates: { lat: poi.latitude, lng: poi.longitude },
          languageMode: 'standard'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      await this.readSSEStream(response.body, onStatus, onToken, onComplete, onError);
    } catch (err: any) {
      console.warn('Backend multi-agent offline, falling back to client RAG mode:', err);
      onStatus({
        layer: 1,
        agent: 'researcher',
        step: 'researching',
        message: `⚡ [클라이언트 RAG] 한국학 지식베이스 기반 ${character.name} 도슨트 생성 중...`
      });

      try {
        const res = await this.geminiFallback.generateSnackStory(poi, character, onToken);
        onComplete(res.text, res.references || ['한국향토문화전자대전']);
      } catch (fallbackErr: any) {
        onError(fallbackErr.message || '도슨트 해설 생성 실패');
      }
    }
  }

  /**
   * Streams interactive chat response from the 2-Layer Multi-Agent Backend
   */
  public static async streamChat(
    poi: POI,
    character: Character,
    userMessage: string,
    history: { role: 'user' | 'model'; text: string }[],
    onStatus: (status: AgentStatusEvent) => void,
    onToken: (token: string) => void,
    onComplete: (fullText: string, sources: string[]) => void,
    onError: (err: string) => void
  ): Promise<void> {
    const url = `${this.backendUrl}/api/agent/stream-chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poiName: poi.name,
          characterId: character.id,
          userMessage,
          history,
          languageMode: 'standard'
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      await this.readSSEStream(response.body, onStatus, onToken, onComplete, onError);
    } catch (err: any) {
      console.warn('Backend multi-agent offline, falling back to client chat mode:', err);
      onStatus({
        layer: 1,
        agent: 'researcher',
        step: 'researching',
        message: `⚡ [클라이언트 RAG] 실시간 지식 검색 및 답변 생성 중...`
      });

      try {
        const res = await this.geminiFallback.sendChatMessage(
          poi,
          character,
          userMessage,
          history.map((h) => ({ sender: h.role, text: h.text })),
          onToken
        );
        onComplete(res.text, ['한국향토문화전자대전']);
      } catch (fallbackErr: any) {
        onError(fallbackErr.message || '답변 생성 실패');
      }
    }
  }

  private static async readSSEStream(
    stream: ReadableStream<Uint8Array>,
    onStatus: (status: AgentStatusEvent) => void,
    onToken: (token: string) => void,
    onComplete: (fullText: string, sources: string[]) => void,
    onError: (err: string) => void
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';
    let sources: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = 'message';
        let dataStr = '';

        const eventLines = block.split('\n');
        for (const line of eventLines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);

          if (eventType === 'agent_status') {
            onStatus(parsed as AgentStatusEvent);
          } else if (eventType === 'research_complete') {
            if (parsed.sources) sources = parsed.sources;
          } else if (eventType === 'persona_stream') {
            if (parsed.token) {
              fullText += parsed.token;
              onToken(parsed.token);
            }
          } else if (eventType === 'done') {
            if (parsed.sources) sources = parsed.sources;
            onComplete(fullText || parsed.fullText, sources);
          } else if (eventType === 'error') {
            onError(parsed.message || '에이전트 오류');
          }
        } catch (e) {
          console.warn('Failed to parse SSE data block:', dataStr, e);
        }
      }
    }
  }
}
