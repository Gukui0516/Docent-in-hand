import { Response } from 'express';
import { KnowledgeResearchAgent, ResearchBriefingNote } from './researchAgent.js';
import { SummaryAgent } from './personaAgents/summaryAgent.js';

export interface StreamStoryRequest {
  poiName: string;
  characterId: string;
  userQuery?: string;
  coordinates?: { lat: number; lng: number };
  languageMode?: 'standard' | 'jeju';
}

export interface StreamChatRequest {
  poiName: string;
  characterId: string;
  userMessage: string;
  coordinates?: { lat: number; lng: number };
  history?: { role: 'user' | 'model'; text: string }[];
  languageMode?: 'standard' | 'jeju';
}

export class AgentOrchestrator {
  /**
   * Executes 2-Layer Multi-Agent Workflow for Zero-Click Docent Story (SSE Stream)
   */
  public static async orchestrateStoryStream(
    req: StreamStoryRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const { poiName, characterId, userQuery, coordinates } = req;

    this.sendSSE(res, 'agent_status', {
      layer: 1,
      agent: 'researcher',
      step: 'researching',
      message: `🔍 [1계층 리서치 에이전트] [${poiName}] 학술 자료 탐색 및 인출 중...`
    });

    try {
      // 1. Layer 1: Knowledge & Spatial Research Agents
      const briefing: ResearchBriefingNote = await KnowledgeResearchAgent.conductResearch(
        poiName,
        userQuery,
        coordinates,
        (msg) => this.sendSSE(res, 'agent_status', { layer: 1, agent: 'researcher', step: 'progress', message: msg })
      );

      this.sendSSE(res, 'research_complete', {
        targetPOI: poiName,
        folkloreCount: briefing.matchedFolklore.length,
        historyCount: briefing.matchedHistoryAndPeople.length,
        geologyCount: briefing.matchedGeologyAndNature.length,
        sources: briefing.academicSources
      });

      // 2. Layer 2: Summary Agent
      this.sendSSE(res, 'agent_status', {
        layer: 2,
        agent: 'summaryAgent',
        step: 'storytelling',
        message: `📌 [핵심 요약 에이전트] 서두·종두 없이 간결한 핵심 요약 작성 중...`
      });

      let fullText = '';
      const onToken = (token: string) => {
        fullText += token;
        this.sendSSE(res, 'persona_stream', { token, characterId: 'summaryAgent' });
      };

      await SummaryAgent.generateStoryStream(poiName, briefing, onToken);

      const totalLatencyMs = Date.now() - startTime;
      this.sendSSE(res, 'done', {
        fullText,
        totalLatencyMs,
        sources: briefing.academicSources
      });
      res.end();
    } catch (err: any) {
      console.error('Agent orchestration error:', err);
      this.sendSSE(res, 'error', { message: err.message || '에이전트 실행 중 오류가 발생했습니다.' });
      res.end();
    }
  }

  /**
   * Executes 2-Layer Multi-Agent Workflow for Interactive Chat (SSE Stream)
   */
  public static async orchestrateChatStream(
    req: StreamChatRequest,
    res: Response
  ): Promise<void> {
    const startTime = Date.now();
    const { poiName, characterId, userMessage, coordinates, history = [] } = req;

    this.sendSSE(res, 'agent_status', {
      layer: 1,
      agent: 'researcher',
      step: 'researching',
      message: `🔍 "${userMessage}" 관련 학술 지식 및 주변 1KM 지리 인출 중...`
    });

    try {
      // 1. Layer 1: Knowledge & Spatial Research Agents
      const briefing = await KnowledgeResearchAgent.conductResearch(
        poiName,
        userMessage,
        coordinates,
        (msg) => this.sendSSE(res, 'agent_status', { layer: 1, agent: 'researcher', step: 'progress', message: msg })
      );

      // 2. Layer 2: Summary Agent
      this.sendSSE(res, 'agent_status', {
        layer: 2,
        agent: 'summaryAgent',
        step: 'answering',
        message: `💬 [핵심 요약 에이전트] 간결한 답변 작성 중...`
      });

      let fullText = '';
      const onToken = (token: string) => {
        fullText += token;
        this.sendSSE(res, 'persona_stream', { token, characterId: 'summaryAgent' });
      };

      await SummaryAgent.answerChatStream(poiName, userMessage, briefing, history, onToken);

      const totalLatencyMs = Date.now() - startTime;
      this.sendSSE(res, 'done', {
        fullText,
        totalLatencyMs,
        sources: briefing.academicSources
      });
      res.end();
    } catch (err: any) {
      console.error('Agent chat orchestration error:', err);
      this.sendSSE(res, 'error', { message: err.message || '에이전트 답변 생성 중 오류가 발생했습니다.' });
      res.end();
    }
  }

  private static sendSSE(res: Response, event: string, data: any) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private static getCharacterDisplayName(_id: string): string {
    return '핵심 요약 에이전트';
  }
}
