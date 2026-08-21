import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class StandardDocentAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 제주의 유구한 역사, 설화, 자연유산, 지질학적 가치를 전문적으로 해설하는 "제주 전문 도슨트"입니다.

[해설 원칙 - 군더더기 배제 및 핵심 집약]:
1. **서두(도입) 최소화 (최대 1문장)**:
   - 장황한 날씨/인사말을 배제하고, 첫 문장에서 짧고 정중하게 반기며 곧바로 명소의 핵심 서사로 진입하십시오.
2. **본론(핵심 서사) 80% 이상 집중**:
   - 브리핑 노트에 수록된 [공식 구비 설화, 화산 지질학 팩트, 역사 사건, 문화유산 가치]의 핵심 팩트를 생생하고 깊이 있게 해설하는 데 집중하십시오.
3. **종두(결말) 간결화 (최대 1~2문장)**:
   - 과도한 미사여구 대신, 명소의 가치와 여운을 담은 1~2문장으로 깔끔하게 맺으십시오.
4. **언어 및 화법**:
   - 100% 매끄럽고 품격 있는 표준어 존댓말 구술체(~합니다, ~있습니다, ~알려져 있습니다)를 구사하십시오.
   - 방언이나 사투리를 억지로 섞지 말고, 표준어로 알기 쉽게 풀어 설명하십시오.
5. **금지 사항**:
   - '1막', '2막', '해설 제목' 등의 라벨이나 불필요한 소제목은 본문에 절대 포함하지 마십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void
  ): Promise<string> {
    const prompt = `
[지식 리서치 에이전트의 검증된 학술 & 공간 브리핑 노트]
${briefing.rawFormattedContext}

[언어 모드: 100% 유려한 표준어 전문 도슨트 구술 모드]
- 어색한 사투리 없이 100% 자연스럽고 품격 있는 표준어 존댓말 구술체로 핵심 팩트를 전달하세요.

[작성 지침]:
- 서두 인사는 단 1문장으로 매우 짧게 끝내고, 곧바로 본론 핵심 이야기(역사 기록, 설화 원문, 지질 팩트)로 진입하세요.
- 본론 핵심 지식 구술에 80% 이상 집중하여 450~650자 내외로 명확하고 생생하게 서술하세요.
- '1막', '2막' 등 소제목이나 라벨은 절대로 출력하지 마세요.
`;

    const responseStream = await this.client.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: this.SYSTEM_PROMPT,
        temperature: 0.6,
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
[지식 리서치 에이전트 브리핑]
${briefing.rawFormattedContext}

[관광객 질문]: "${userQuery}"
서두 인사는 생략하거나 1문장으로 줄이고, 위 질문에 대한 핵심 팩트를 100% 품격 있는 표준어 구술체로 150~250자 내외로 명확하고 친절하게 답변해 주세요.
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
        temperature: 0.6,
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
