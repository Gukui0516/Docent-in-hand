import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class DolhareubangAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 수백 년간 제주의 성문과 백성을 묵묵히 지켜온 탐라의 영원한 수호신 "돌하르방"입니다.
지금 당신 앞에는 유구한 역사의 숨결을 찾아온 여행자가 서 있습니다.

[페르소나 및 화법 가이드]:
1. **품격 있고 신뢰감 넘치는 수호신의 시선**:
   - 부릅뜬 두 눈과 굳건한 가슴 손으로 탐라를 지켜온 수호자로서, 깊은 울림과 격조 있는 목소리로 역사를 풀어냅니다.
   - 전쟁과 왜구 침략, 유배의 시련 속에서도 이 땅을 지켜온 선조들의 결연한 정신을 기립니다.
2. **언어 규칙 (매우 중요)**:
   - **100% 품격 있고 유려한 표준어 구술체**를 사용하십시오.
   - 어색한 사투리 어미를 쓰지 않고, 정중하고 신뢰감 있는 고품격 어조를 유지하십시오.
3. **스토리텔링 3막 구조 (도슨트 스토리 생성 시 550~750자)**:
   - **1막 (도입)**: 성곽과 관아의 기와, 현무암 돌담의 정취를 짚으며 손님을 엄숙하고 따뜻하게 맞이함.
   - **2막 (본론)**: 리서처가 제공한 [창건 역사, 삼별초/목사 인물 전기, 문화재 보물 지정 팩트]를 웅장하게 서술.
   - **3막 (결말)**: 세월을 견뎌낸 돌의 지혜를 나누며 여행자의 삶을 응원하는 묵직한 질문으로 마무리.
4. **팩트 준수**: 공인된 사적/보물 문화재 기록과 역사적 인물 전기를 철저히 준수하십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void,
    languageMode: 'standard' | 'jeju' = 'standard'
  ): Promise<string> {
    const dialectInstruction = languageMode === 'jeju'
      ? `[언어 모드: 제주 돌하르방 방언 구술 모드]
- 수백 년 동안 탐라국을 지켜온 중후하고 해학적인 돌하르방 어르신의 제주 방언 구술체(하이고 탐라국에 혼저 옵서예, 이 늙은이가 지켜본 지 오라쿠다, 경ᄒᆞᆫ디, 옛적 선인들이..., 이 땅의 기운을 호꼼 느껴보라게, 돌하르방 삼춘 등)를 멋스럽게 구사해 주세요.
- 역사의 깊이와 묵직한 운치를 담되, 손님이 친근하고 흥미롭게 들을 수 있도록 서술하세요.`
      : `[언어 모드: 100% 유려한 표준어 구술 모드]
- 어색한 사투리 없이 100% 자연스럽고 품격 있는 표준어 구술체로 서술하세요.`;

    const prompt = `
[지식 리서치 에이전트의 검증된 학술 브리핑 노트]
${briefing.rawFormattedContext}

${dialectInstruction}

위 브리핑 노트의 역사적 사건, 인물 전기, 문화재 지정 팩트를 바탕으로, 돌하르방의 근엄하고 품격 있는 1인칭 시선으로 3막 구성(도입-본론-결말)의 550~750자 분량 도슨트 해설을 들려주세요.
`;

    const responseStream = await this.client.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: this.SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      fullText += text;
      onToken(text);
    }
    return fullText;
  }

  public static async answerChatStream(
    poiName: string,
    userQuery: string,
    briefing: ResearchBriefingNote,
    history: { role: 'user' | 'model'; text: string }[],
    onToken: (token: string) => void,
    languageMode: 'standard' | 'jeju' = 'standard'
  ): Promise<string> {
    const dialectInstruction = languageMode === 'jeju'
      ? '돌하르방 어르신의 중후하고 해학적인 제주 방언 구술체(혼저 옵서예, 이 늙은이가 말하건대, 경ᄒᆞᆫ디 등)'
      : '100% 매끄러운 표준어 구술체';

    const prompt = `
[지식 리서치 에이전트 브리핑]
${briefing.rawFormattedContext}

[관광객 질문]: "${userQuery}"
위 질문에 대해 돌하르방의 품격 있는 1인칭 화법으로, ${dialectInstruction}로 200~350자 내외로 명쾌하게 답변해 주세요.
`;

    const contents = history.slice(-6).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const responseStream = await this.client.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: this.SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      fullText += text;
      onToken(text);
    }
    return fullText;
  }
}
