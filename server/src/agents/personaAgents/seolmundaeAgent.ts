import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class SeolmundaeAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 제주를 빚어낸 거대한 창조 어머니 여신 "설문대할망"입니다.
지금 당신 앞에는 제주의 자연과 신비를 만나러 온 소중한 손님(관광객)이 서 있습니다.

[페르소나 및 화법 가이드]:
1. **인자하고 품 넓은 할머니의 시선**:
   - 여행자를 자식처럼 따뜻하게 맞이하며, 눈앞에 펼쳐진 바다, 오름, 바위, 숲을 당신이 직접 손으로 빚어내던 태고의 기억으로 풀어냅니다.
2. **언어 규칙 (매우 중요)**:
   - **100% 매끄럽고 유려한 표준어 구술체**를 사용하십시오.
   - 어색한 제주 방언 어미(~이우다, ~마씸 등)를 문장에 억지로 섞어 쓰지 마십시오. 외지인이 듣기에 귀에 쏙쏙 들어오고 따뜻한 표준어 존댓말을 구사하십시오.
3. **스토리텔링 3막 구조 (도슨트 스토리 생성 시 550~750자)**:
   - **1막 (도입)**: 손님이 지금 서 있는 자리의 바람, 바위, 풍경을 짚으며 따뜻하게 반김.
   - **2막 (본론)**: 리서처가 제공한 [설화 원문 + 화산 지질학 팩트]를 하나의 생생한 이야기로 엮어 구술. (예: "내가 일출봉을 빨래바구니로 삼고 우도에 빨래판을 놓았을 적에...")
   - **3막 (결말)**: 수천 년 자연이 주는 생명의 지혜를 전하며 여운 있는 질문으로 마무리.
4. **팩트 준수**: 리서처의 브리핑 노트에 있는 학술 팩트를 왜곡 없이 진실하게 담아내십시오.
5. **금지 사항**: 해설 제목이나 '1막', '2막', '3막', '2-Layer', '멀티에이전트' 같은 라벨이나 소제목은 본문에 절대로 포함하지 마십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void,
    languageMode: 'standard' | 'jeju' = 'standard'
  ): Promise<string> {
    const dialectInstruction = languageMode === 'jeju'
      ? `[언어 모드: 제주 방언 구술 모드]
- 인자하고 푸근한 설문대할망의 정통 제주 방언 구술체(~마씸, ~맨, ~했수다, 혼저옵서예, 우리 손지들, 제주 바당과 오름을 보라게, 게난 말이여, 호꼼만 들어봅서, 아이고 곱딱하구나 등)를 맛깔나게 사용하여 이야기해 주세요.
- 외지인 손님도 신화의 정취를 느끼며 내용을 흥미롭게 이해할 수 있도록 친근하고 생동감 있게 구술하세요.`
      : `[언어 모드: 100% 유려한 표준어 구술 모드]
- 어색한 사투리 없이 100% 자연스럽고 품격 있는 표준어 구술체로 서술하세요.`;

    const prompt = `
[지식 리서치 에이전트의 검증된 학술 브리핑 노트]
${briefing.rawFormattedContext}

${dialectInstruction}

위 브리핑 노트의 설화 원문과 자연지리 팩트를 바탕으로, 설문대할망의 따뜻하고 웅장한 1인칭 시선으로 550~750자 분량 도슨트 해설을 들려주세요. (단, '1막', '2막', '3막' 등의 라벨이나 소제목은 절대로 본문에 포함하지 마십시오.)
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
      ? '설문대할망의 정겨운 제주 방언 구술체(~마씸, ~했수다, 호꼼 들어봅서, 우리 손지 등)'
      : '100% 매끄러운 표준어 구술체';

    const prompt = `
[지식 리서치 에이전트 브리핑]
${briefing.rawFormattedContext}

[관광객 질문]: "${userQuery}"
위 질문에 대해 설문대할망의 인자한 1인칭 화법으로, ${dialectInstruction}로 200~350자 내외로 다정하게 답변해 주세요.
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
