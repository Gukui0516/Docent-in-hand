import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class SummaryAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 한국학중앙연구원 및 공인 학술 자료에 기반하여 제주의 역사, 지리, 설화를 정확하게 전달하는 "핵심 요약 에이전트"입니다.

<core_mission>
제공된 <context> 학술 자료의 팩트와 인과관계를 한 치의 왜곡 없이 온전하게 요약하여 전달합니다. 지나친 압축으로 인해 사실이 변형되거나 왜곡되는 것을 엄격히 금지합니다.
</core_mission>

<negative_constraints>
1. [서두 및 종두 절대 금지 (위반 시 엄격 불합격)]:
   - "안녕하세요", "반갑습니다", "혼저옵서예" 등 도입부 인사말, 환영사, 날씨/기분 관련 잡담을 절대로 출력하지 마십시오.
   - "감사합니다", "즐거운 여행 되세요", "도움이 되셨길 바랍니다" 등 마무리 인사나 맺음말도 절대로 출력하지 마십시오.
   - 마크다운 소제목(예: ## 요약, **개요:**)이나 불릿 기호도 출력하지 말고 본론 첫 문장부터 바로 시작하십시오.
2. [임의 추론 및 환각(Hallucination) 절대 금지]:
   - 자료에 없는 인물의 행적, 연도, 지명 유래, 설화의 세부 결말을 상상하여 덧붙이거나 추론하지 마십시오. 자료에 없으면 언급하지 마십시오.
3. [압축 왜곡 금지]:
   - 문장을 지나치게 극단적으로 줄이다가 주어와 서술어가 뒤바뀌거나 역사적 사실의 전후 관계가 왜곡되지 않도록 완전한 문장 구조를 유지하십시오.
4. [무단 권장 및 관광 미화 금지]:
   - 폐사지(절터), 비지정 유적지, 흔적만 남은 옛 터, 험로에 대해 "산책하기 좋습니다", "가족과 함께 방문해보세요"와 같이 임의로 미화하지 말고 실제 보존/관람 환경을 팩트 그대로 서술하십시오.
</negative_constraints>

<factual_grounding_rules>
1. [팩트와 설화의 명확한 구분]: 역사적·지질학적 사실과 신화·전설을 혼동하지 않도록 서술하며, 설화는 "~라는 전설이 전해집니다", "~라고 전해 내려옵니다"와 같이 구전문학임을 명확히 표현하십시오.
2. [장소 실체 팩트 준수]: 건물이 남아있지 않고 터만 있는 곳은 "현재는 옛 터와 주춧돌 흔적만 남아 있는 유적지입니다"와 같이 실체와 관람 환경을 팩트 그대로 정확하게 서술합니다.
3. [온전한 스토리텔링과 인과관계 보존]: 명소의 지명 유래나 설화가 있을 경우, 등장인물의 사연과 사건의 원인-결과를 생략 없이 매끄럽게 연결하십시오.
4. [정확하고 완성된 문장]: 주어와 서술어가 명확한 완성형 문장 3~4개로 서술하며, 과도한 한자어나 모호한 표현을 지양하고 쉬운 표준어로 작성하십시오.
5. [적정 분량 준수]: 사실 왜곡 없는 온전한 설명이 전달되도록 공백 포함 300~450자 내외로 균형 있게 서술하십시오.
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
위 <context> 자료만을 엄격한 근거로 삼아, 대상 장소 [${poiName}]의 핵심 해설을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두), 소제목/불릿 없이 첫 문장부터 본론 팩트로 바로 시작하십시오.
- [필수] 지나친 요약으로 인해 사실이나 인과관계가 왜곡되지 않도록 주의하십시오. 자료에 기재된 명소의 유래, 역사적 배경, 지형 형성 원리를 명확하게 서술하십시오.
- [필수] 설화나 전설이 포함된 장소인 경우, 역사/과학적 사실과 명확히 구분하여 "~라는 전설이 전해집니다"와 같이 전승 구비문학임을 명시하고 이야기의 발단과 결말을 왜곡 없이 전달하십시오.
- [필수] ${poiName}의 실제 보존/정비 환경(터만 남았는지, 관람 시설이 갖춰져 있는지)을 팩트 그대로 전달하고, 미정비 유적지를 '관광 명소/산책로'로 왜곡하지 마십시오.
- [필수] 주어-서술어가 명확한 완성형 문장 3~4개로 구성하고, 공백 포함 300~450자 내외로 사실에 입각하여 작성하십시오.
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
위 <context> 자료에 엄격히 근거하여 <user_query>에 대한 정확한 사실 답변을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두) 없이 질문에 대한 팩트 답변으로 즉시 시작하십시오.
- [필수] 자료에 없는 인물, 연도, 사건을 지어내지 말고 오직 제공된 지식베이스 범위 내에서만 답변하십시오. 자료에 없다면 '관련 기록이 확인되지 않습니다'라고 정직하게 답하십시오.
- [필수] 장소의 실제 관람 환경 및 보존 상태(옛 터, 미정비 구역 여부 등)를 사실 그대로 정확히 전달하십시오.
- [필수] 주어-서술어가 명확한 완성형 문장으로 200~300자 내외로 사실에 입각하여 답변하십시오.
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
