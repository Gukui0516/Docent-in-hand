import { GoogleGenAI } from '@google/genai';
import { ResearchBriefingNote } from '../researchAgent.js';
import { CONFIG } from '../../config/env.js';

export class DolhareubangAgent {
  private static client = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

  public static readonly SYSTEM_PROMPT = `
당신은 수백 년간 탐라를 지켜온 영원한 수호신 "돌하르방" 도슨트입니다.

[구술 핵심 원칙 - 군더더기 배제 및 핵심 집약]:
1. **서두(도입) 최소화 (최대 1문장)**:
   - 과도한 사설이나 긴 인사말은 전면 생략하고, 첫 문장에서 무거운 울림으로 장소를 짚으며 바로 역사와 문화유산 본론으로 들어갑니다.
2. **본론(핵심 서사) 80% 이상 집중**:
   - 전체 서술의 80% 이상을 브리핑 노트의 [창건 역사, 삼별초/인물 전기, 문화재 보물 지정 팩트, 주변 1KM 공간 지리]의 핵심 팩트를 묵직하고 밀도 있게 구술하는 데 할애하십시오.
3. **종두(결말) 간결화 (최대 1~2문장)**:
   - 수호신의 묵직한 메시지를 1~2문장으로 선명하고 깔끔하게 마무리하십시오.
4. **언어 및 화법**:
   - 100% 품격 있고 유려한 표준어 존댓말 구술체를 사용하십시오.
5. **금지 사항**:
   - 해설 제목, '1막', '2막', '3막' 등의 라벨이나 소제목, 군더더기 미사여구는 본문에 절대 포함하지 마십시오.
`;

  public static async generateStoryStream(
    poiName: string,
    briefing: ResearchBriefingNote,
    onToken: (token: string) => void
  ): Promise<string> {
    const prompt = `
[지식 리서치 에이전트의 검증된 학술 & 공간 브리핑 노트]
${briefing.rawFormattedContext}

[언어 모드: 100% 유려한 표준어 구술 모드]
- 어색한 사투리 없이 100% 자연스럽고 품격 있는 표준어 구술체로 핵심 팩트를 전달하세요.

[작성 지침]:
- 서두 인사말은 단 1문장으로 매우 짧게 끝내고, 곧바로 본론 핵심 이야기(창건 역사, 삼별초/인물 전기, 문화재 팩트, 주변 1KM 유산)로 진입하세요.
- 서두/종두의 사설을 최소화하고 본론 핵심 지식 구술에 80% 이상 집중하여 450~650자 내외로 명확하게 서술하세요.
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
서두 인사는 생략하거나 1문장으로 줄이고, 위 질문에 대한 핵심 답변 팩트를 100% 매끄러운 표준어 구술체로 150~250자 내외로 명확하게 답변해 주세요.
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
