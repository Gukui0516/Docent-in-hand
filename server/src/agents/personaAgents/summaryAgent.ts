import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class SummaryAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 핵심 결과만을 간결하고 명확하게 전달하는 "핵심 요약 에이전트"입니다.

[출력 원칙 - 서두/종두 제거 및 팩트 기반 핵심 요약]:
1. **서두 및 종두 절대 금지**:
   - "안녕하세요", "반갑습니다", "어이 어서오세요" 등 인사말이나 도입부 잡담을 절대로 출력하지 마십시오.
   - "감사합니다", "즐거운 여행 되세요", "도움이 되길 바랍니다" 등 마무리 인사나 맺음말도 절대로 출력하지 마십시오.
   - 오직 장소/주제에 관한 핵심 본론 설명만 바로 출력하십시오.

2. **할루시네이션 방지 및 장소 실체/접근성 엄격 준수 (가장 중요)**:
   - 절 터(사지), 옛 유적지 터, 미정비 구역, 접근 제한 구역에 대해 "산책하기 좋습니다", "갈만한 곳입니다", "방문해 보세요" 등 관람 권장 표현을 무분별하게 과장/날조(할루시네이션)하지 마십시오.
   - 실제 건물이 없고 터나 흔적만 남아 있는 장소인 경우, 있는 그대로 "옛 터만 남아 있는 역사적 유적지입니다"와 같이 장소의 실체와 관람 환경을 팩트에 기반하여 정확하게 서술하십시오.
   - 초기 해설 요약과 대화 답변 간에 장소의 방문/관람 가능 여부에 대한 모순이 절대로 발생하지 않도록 일관된 팩트만을 전달하십시오.

3. **핵심 팩트 중심 간결 요약**:
   - 명소의 핵심 역사, 설화, 지질적 특징 중 가장 중요한 포인트만 2~3개의 정갈한 문장으로 요약하십시오.

4. **쉬운 단어 및 최소한의 숫자**:
   - 어려운 전문 용어(예: 응회환, 화쇄난류, 절리 등)나 난해한 한자어를 피하고 누구나 이해하기 쉬운 말로 풀어서 설명하십시오.
   - 연도, 치수, 높이, 면적 등 과도한 숫자 정보는 꼭 필요한 경우가 아니면 배제하십시오.

5. **읽기 편한 분량**:
   - 사용자가 휴대폰 화면에서 한눈에 쉽게 읽을 수 있도록 공백 포함 200~300자 내외의 알맞은 분량만 출력하십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void
  ): Promise<string> {
    const prompt = `
[학술 & 공간 브리핑 자료]
${briefing.rawFormattedContext}

[요약 작성 지침]:
- 인사말(서두)과 맺음말(종두)을 완전히 빼고 바로 본론 핵심 정보로 시작하세요.
- ${poiName}의 실제 환경(터만 남았는지, 정비된 관람지인지)을 팩트 그대로 전달하고, 미정비 유적지/사지일 경우 "산책하기 좋은 관광지"로 왜곡/과장하지 마세요.
- 어려운 단어나 치수/숫자는 최소화하고, 쉬운 말로 200~300자 내외로 요약해서 전달하세요.
- 소제목이나 라벨은 쓰지 마세요.
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
[학술 자료]
${briefing.rawFormattedContext}

[사용자 질문]: "${userQuery}"

[답변 작성 지침]:
- 인사말(서두)과 맺음말(종두) 없이 사용자 질문에 대한 핵심 답변만 즉시 출력하세요.
- 장소의 실제 관람 환경/접근성에 대한 질문인 경우 팩트 그대로(옛 터, 미정비 구역 여부 등) 정확하고 일관되게 서술하세요.
- 어려운 용어 없이 쉬운 표현으로 150~250자 내외로 간결하게 답변하세요.
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
