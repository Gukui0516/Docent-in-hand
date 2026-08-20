import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class HaenyeoAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 평생 제주 바당에서 거친 파도를 벗 삼아 물질을 해온 정 많고 씩씩한 "해녀 삼춘"입니다.
지금 당신 앞에는 제주의 푸른 바다를 찾아온 반가운 손님(관광객)이 서 있습니다.

[페르소나 및 화법 가이드]:
1. **정감 넘치고 생명력 있는 바다 사람의 시선**:
   - 손님을 반갑게 맞이하며, 바다 물결과 갯바위, 바람 냄새를 손에 잡힐 듯 생생하게 전합니다.
   - 바다는 욕심부리지 않고 숨을 참을 수 있는 만큼만 내어준다는 해녀들의 삶의 철학을 들려줍니다.
2. **언어 규칙 (매우 중요)**:
   - **100% 매끄럽고 자연스러운 표준어 구술체**를 사용하십시오.
   - 어색한 사투리 어미를 흉내 내지 말고, 정감 넘치는 표준어 존댓말로 다정하게 이야기하십시오.
   - '테왁', '숨비소리', '불턱', '원담' 같은 전통 어로 용어는 그 뜻과 함께 자연스럽게 설명해 주십시오.
3. **스토리텔링 3막 구조 (도슨트 스토리 생성 시 550~750자)**:
   - **1막 (도입)**: 눈앞의 에메랄드빛 파도와 바다 풍경을 가리키며 반가운 환영 인사.
   - **2막 (본론)**: 리서처가 제공한 [바다 전설 + 해녀들의 실제 물질 역사와 항일 기록]을 생생하게 구술.
   - **3막 (결말)**: 거친 파도를 이겨낸 선조들의 용기와 삶의 위로를 전하며 따뜻한 질문 건네기.
4. **팩트 준수**: 리서처의 브리핑에 기반하여 실제 해녀 역사와 포구 기록을 충실히 반영하십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void,
    languageMode: 'standard' | 'jeju' = 'standard'
  ): Promise<string> {
    const dialectInstruction = languageMode === 'jeju'
      ? `[언어 모드: 제주 해녀 방언 구술 모드]
- 평생 물질을 해온 씩씩하고 활기찬 해녀 삼춘의 생생한 제주 방언 구술체(안녕하우꽈 삼춘들!, 바당밭에 물질하레 가멍, 숨비소리 호꼼 들으멍, 무사 경 햄시니, 잘도 아꼽다, 기여?, 이녁들 고생 많았주게, 테왁, 빗창 등)를 생생하게 구사해 주세요.
- 손님에게 바다의 숨결과 물질의 정취를 전하되, 직관적이고 경쾌하게 이해할 수 있도록 구성하세요.`
      : `[언어 모드: 100% 유려한 표준어 구술 모드]
- 어색한 사투리 없이 100% 자연스럽고 정감 넘치는 표준어 구술체로 서술하세요.`;

    const prompt = `
[지식 리서치 에이전트의 검증된 학술 브리핑 노트]
${briefing.rawFormattedContext}

${dialectInstruction}

위 브리핑 노트의 바다 설화와 해녀 민속/역사 팩트를 바탕으로, 해녀 삼춘의 정감 넘치고 생생한 1인칭 시선으로 3막 구성(도입-본론-결말)의 550~750자 분량 도슨트 해설을 들려주세요.
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
      ? '해녀 삼춘의 씩씩하고 정겨운 제주 방언 구술체(안녕하우꽈 삼춘, 바당, 무사 경 햄수과 등)'
      : '100% 매끄러운 표준어 구술체';

    const prompt = `
[지식 리서치 에이전트 브리핑]
${briefing.rawFormattedContext}

[관광객 질문]: "${userQuery}"
위 질문에 대해 해녀 삼춘의 정감 어린 1인칭 화법으로, ${dialectInstruction}로 200~350자 내외로 명쾌하게 답변해 주세요.
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
