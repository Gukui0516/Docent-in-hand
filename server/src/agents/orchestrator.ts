import { Response } from 'express';
import { KnowledgeResearchAgent, ResearchBriefingNote } from './researchAgent.js';
import { SeolmundaeAgent } from './personaAgents/seolmundaeAgent.js';
import { HaenyeoAgent } from './personaAgents/haenyeoAgent.js';
import { DolhareubangAgent } from './personaAgents/dolhareubangAgent.js';

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
    const { poiName, characterId, userQuery, languageMode = 'standard' } = req;

    const modeLabel = languageMode === 'jeju' ? '🍊 제주 방언 모드' : '🗣️ 표준어 모드';

    this.sendSSE(res, 'agent_status', {
      layer: 1,
      agent: 'researcher',
      step: 'researching',
      message: `🔍 [리서치 에이전트] 18종 한국학 아카이브(5,161건)에서 [${poiName}] 공인 팩트 탐색 중...`
    });

    try {
      // 1. Layer 1: Knowledge Research Agent
      const briefing: ResearchBriefingNote = await KnowledgeResearchAgent.conductResearch(
        poiName,
        userQuery,
        (msg) => this.sendSSE(res, 'agent_status', { layer: 1, agent: 'researcher', step: 'progress', message: msg })
      );

      this.sendSSE(res, 'research_complete', {
        targetPOI: poiName,
        folkloreCount: briefing.matchedFolklore.length,
        historyCount: briefing.matchedHistoryAndPeople.length,
        geologyCount: briefing.matchedGeologyAndNature.length,
        sources: briefing.academicSources
      });

      // 2. Layer 2: Persona Docent Selection
      const characterName = this.getCharacterDisplayName(characterId);
      this.sendSSE(res, 'agent_status', {
        layer: 2,
        agent: characterId,
        step: 'storytelling',
        message: `🎭 [${characterName}] (${modeLabel}) 학술 지식을 바탕으로 맞춤형 도슨트 해설 구술 중...`
      });

      let fullText = '';
      const onToken = (token: string) => {
        fullText += token;
        this.sendSSE(res, 'persona_stream', { token, characterId });
      };

      if (characterId === 'haenyeo') {
        await HaenyeoAgent.generateStoryStream(poiName, briefing, onToken, languageMode);
      } else if (characterId === 'dolhareubang') {
        await DolhareubangAgent.generateStoryStream(poiName, briefing, onToken, languageMode);
      } else {
        await SeolmundaeAgent.generateStoryStream(poiName, briefing, onToken, languageMode);
      }

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
    const { poiName, characterId, userMessage, history = [], languageMode = 'standard' } = req;

    const modeLabel = languageMode === 'jeju' ? '🍊 제주 방언 모드' : '🗣️ 표준어 모드';

    this.sendSSE(res, 'agent_status', {
      layer: 1,
      agent: 'researcher',
      step: 'researching',
      message: `🔍 "${userMessage}" 관련 학술 지식 인출 중...`
    });

    try {
      // 1. Layer 1: Knowledge Research Agent
      const briefing = await KnowledgeResearchAgent.conductResearch(
        poiName,
        userMessage,
        (msg) => this.sendSSE(res, 'agent_status', { layer: 1, agent: 'researcher', step: 'progress', message: msg })
      );

      // 2. Layer 2: Persona Response
      const characterName = this.getCharacterDisplayName(characterId);
      this.sendSSE(res, 'agent_status', {
        layer: 2,
        agent: characterId,
        step: 'answering',
        message: `💬 [${characterName}] (${modeLabel}) 답변 구술 중...`
      });

      let fullText = '';
      const onToken = (token: string) => {
        fullText += token;
        this.sendSSE(res, 'persona_stream', { token, characterId });
      };

      if (characterId === 'haenyeo') {
        await HaenyeoAgent.answerChatStream(poiName, userMessage, briefing, history, onToken, languageMode);
      } else if (characterId === 'dolhareubang') {
        await DolhareubangAgent.answerChatStream(poiName, userMessage, briefing, history, onToken, languageMode);
      } else {
        await SeolmundaeAgent.answerChatStream(poiName, userMessage, briefing, history, onToken, languageMode);
      }

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

  private static getCharacterDisplayName(id: string): string {
    if (id === 'haenyeo') return '해녀 삼춘';
    if (id === 'dolhareubang') return '돌하르방';
    return '설문대할망';
  }
}
