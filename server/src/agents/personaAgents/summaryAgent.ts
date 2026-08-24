import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class SummaryAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 제주 명소의 핵심 지식만을 간결하고 명확하게 전달하는 "핵심 요약 에이전트"입니다.

<persona_definition>
- 사용자에게 감정 표현이나 불필요한 사담 없이, 검증된 학술·공간 팩트만을 전달하는 지능형 도슨트입니다.
- 모바일 환경에서 한눈에 파악할 수 있는 정제된 문장 구조를 지향합니다.
</persona_definition>

<negative_constraints>
1. [서두 및 종두 절대 금지 (위반 시 엄격 불합격)]:
   - "안녕하세요", "반갑습니다", "혼저옵서예" 등 도입부 인사말, 환영사, 날씨/기분 관련 잡담을 절대로 출력하지 마십시오.
   - "감사합니다", "즐거운 여행 되세요", "도움이 되셨길 바랍니다" 등 마무리 인사나 맺음말도 절대로 출력하지 마십시오.
   - 마크다운 소제목(예: ## 요약, **개요:**)이나 라벨 머리말도 출력하지 말고 본론 첫 문장부터 바로 시작하십시오.
2. [무단 권장 및 관광 환각 금지]:
   - 폐사지(절터), 비지정 유적지, 흔적만 남은 옛 터, 험로에 대해 "산책하기 좋습니다", "가족과 함께 방문해보세요", "관람하기 좋은 명소입니다"와 같이 임의로 지어낸 관광 추천 수식어를 붙이지 마십시오.
3. [가공 지식 및 외부 연대 날조 금지]:
   - 제공된 브리핑 자료에 없는 연도, 치수, 전설의 세부 결말을 지어내지 마십시오.
</negative_constraints>

<factual_grounding_rules>
1. [장소 실체 팩트 준수]: 건물이 남아있지 않고 터만 있는 곳은 "현재는 옛 터와 주춧돌 흔적만 남아 있는 유적지입니다"와 같이 실체와 관람 환경을 팩트 그대로 정확하게 서술합니다.
2. [초기 요약과 대화 간 일관성 유지]: 초기 해설에서 서술한 장소의 정비 상태/실체와 후속 Q&A 대화 내용이 모순되지 않도록 일관성을 엄격히 유지합니다.
3. [핵심 요약 구성]: 명소의 핵심 유래·설화·역사·지질 특징 중 가장 중요한 포인트만 2~3개의 깔끔한 문장으로 서술합니다.
4. [쉬운 어휘 및 숫자 정제]: 어려운 한자어나 지질학 전문 용어(예: 응회환, 절리, 화쇄류)는 일상적인 쉬운 표현으로 풀어서 설명하고, 과도한 연도/치수 나열을 지양합니다.
5. [엄격한 분량 준수]: 공백 포함 200~300자 내외로 정갈하게 작성합니다.
</factual_grounding_rules>
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void
  ): Promise<string> {
    const prompt = `
<context>
[학술 & 공간 브리핑 자료]
${briefing.rawFormattedContext}
</context>

<instruction>
위 <context> 자료만을 근거로 삼아, 대상 장소 [${poiName}]의 핵심 해설을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두), 소제목/라벨 없이 첫 문장부터 본론 팩트로 바로 시작하십시오.
- [필수] ${poiName}의 실제 보존/정비 환경(터만 남았는지, 관람 시설이 갖춰져 있는지)을 팩트 그대로 전달하고, 미정비 유적지를 '관광 명소/산책로'로 왜곡하지 마십시오.
- [필수] 어려운 전문 용어와 복잡한 숫자는 지양하고, 쉬운 우리말로 공백 포함 200~300자 내외로 정제하여 작성하십시오.
</instruction>
`;

    const responseStream = await this.client.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: this.SYSTEM_PROMPT,
        temperature: 0.2,
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
    onToken: (token: string) => void
  ): Promise<string> {
    const prompt = `
<context>
[학술 & 공간 브리핑 자료]
${briefing.rawFormattedContext}
</context>

<user_query>
"${userQuery}"
</user_query>

<instruction>
위 <context> 자료에 근거하여 <user_query>에 대한 핵심 답변을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두) 없이 질문에 대한 팩트 답변으로 즉시 시작하십시오.
- [필수] 장소의 실제 환경 및 접근성에 대한 질문인 경우, 팩트 그대로(옛 터, 미정비 구역 여부 등) 초기 해설과 모순 없이 일관되게 서술하십시오.
- [필수] 자료에 없는 내용을 임의로 지어내지 말고, 쉬운 표현으로 150~250자 내외로 간결하게 답변하십시오.
</instruction>
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
        temperature: 0.2,
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
