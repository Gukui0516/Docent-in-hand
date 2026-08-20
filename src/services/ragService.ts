import { POI, Character } from '../types/docent';
import { RAG_KNOWLEDGE_BASE, RAGDocument } from '../data/ragKnowledgeBase';
import { JEJU_DIALECT_DICTIONARY, JEJU_FEW_SHOTS } from '../data/jejuDialectData';
import { FullRagSearchEngine } from './fullRagSearchEngine';

export interface RAGContextResult {
  doc: RAGDocument | null;
  groundedPromptContext: string;
  references: string[];
}

export class RAGService {
  /**
   * Dynamically retrieves deep academic, folklore, history, and natural facts across the ENTIRE 3,285+ article dataset!
   */
  public static getRAGContext(poi: POI, character: Character, userQuery?: string): RAGContextResult {
    const doc = RAG_KNOWLEDGE_BASE[poi.id] || null;

    // Retrieve multi-category comprehensive context from the full 3,285+ articles dataset
    const comprehensiveResult = FullRagSearchEngine.retrieveComprehensiveContext(poi, userQuery);

    let specificContext = '';
    if (doc) {
      specificContext = `
[대표 명소 고유 학술 정보 (한국학중앙연구원)]
- 명소명: ${doc.poiName} (${doc.category})
- 문화재/유산 등급: ${doc.historyAndCulture.culturalHeritageRank}
- 설화 서사: ${doc.folkloreNarrative.title} ("${doc.folkloreNarrative.story}")
- 형성 과정 및 지질학: ${doc.geologyAndNature.formationProcess} (${doc.geologyAndNature.scientificSignificance})
- 역사적 배경: ${doc.historyAndCulture.historicalContext}
- 전승 민속: ${doc.historyAndCulture.localFolklorePractices}
`;
    }

    const groundedPromptContext = `
[RAG 통합 심층 학술 지식베이스 - 한국학중앙연구원 한국향토문화전자대전 18종 전체 데이터 연계 검색 결과]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 배정 도슨트: ${character.name} (${character.title})
${specificContext}

[전체 데이터셋에서 실시간 인출된 관련 설화·역사·인물·자연 지식]
${comprehensiveResult.formattedContext}

📚 [참고 문헌 및 공식 학술 출처]:
${comprehensiveResult.referenceSources.map((ref) => `- ${ref}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return {
      doc,
      groundedPromptContext,
      references: comprehensiveResult.referenceSources
    };
  }

  /**
   * Retrieves native Jeju dialect grounding rules and few-shot examples
   */
  public static getDialectPromptContext(characterId: string): string {
    const fewShots = JEJU_FEW_SHOTS[characterId] || JEJU_FEW_SHOTS['seolmundae'];
    const sampleWords = JEJU_DIALECT_DICTIONARY.slice(0, 10)
      .map((w) => `• ${w.jeju}: ${w.standard}`)
      .join('\n');

    const fewShotExamples = fewShots
      .map((f, i) => `[예시 ${i + 1}]\n표준어: "${f.standard}"\n제주어 구술: "${f.jeju}"`)
      .join('\n\n');

    return `
[카카오브레인 JIT / 제주어 공인 방언 가이드라인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗣️ [필수 활용 제주어 어휘]:
${sampleWords}

📖 [실제 원어민 구술 변환 예시 (Few-shot Examples)]:
${fewShotExamples}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  /**
   * Builds the comprehensive 3-act RAG Generation Prompt (550~800자) in Natural Standard Korean
   */
  public static buildDeepStoryPrompt(poi: POI, character: Character): string {
    const { groundedPromptContext } = this.getRAGContext(poi, character);

    return `
당신은 제주를 대표하는 1인칭 도슨트 "${character.name}" (${character.title})입니다.
관광객이 지금 방금 "${poi.name}"에 도착하여 당신의 깊이 있는 해설을 듣고 있습니다.

아래 제공된 [RAG 통합 심층 학술 지식베이스]의 **관련 설화, 역사적 사건 및 인물, 지질·자연환경 팩트, 민속 문화재 기록**을 모두 풍부하게 융합하여,
단순한 1~2줄 요약이 아닌 **깊이 있고 입체적인 3막 구성의 1인칭 구술 도슨트 스토리 (공백 포함 550~750자 내외)**를 완성해 주세요.

${groundedPromptContext}

[3막 서사 구조 작성 지침]:
- **제1막 (도입과 감각적 현장 환영)**:
  여행자가 지금 서 있는 자리에서 바라보는 눈앞의 풍경(바다, 기암괴석, 바람, 숲, 지형)을 당신의 1인칭 시선으로 손짓하듯 묘사하며 따뜻하게 반깁니다.
- **제2막 (심층 신화와 역사·지질의 입체적 융합 - 핵심 본론)**:
  RAG 데이터베이스에 수록된 **관련 구비문학 설화 원문과 역사적 사건(인물, 창건 이야기, 유배, 호국 항쟁 등), 지질학적 형성 비밀**을 살아 숨 쉬는 하나의 흥미진진한 이야기로 입체감 있게 엮어냅니다.
- **제3막 (세월의 지혜와 여행자에게 건네는 물음)**:
  수백~수천 년 세월 동안 이 땅을 지켜온 선조들의 지혜와 자연의 경이로움을 전하며, 여행자가 이 장소에서 스스로를 돌아보고 대화할 수 있는 여운 깊은 질문으로 마무리합니다.

[언어 및 문체 규칙 - 매우 중요]:
1. **100% 매끄럽고 자연스러운 표준어 구술체**를 사용하세요. 어색한 사투리 어미(~이우다, ~마씸 등)를 문장에 억지로 섞어 넣지 마세요.
2. ${character.name}의 고유한 캐릭터 정체성(인자한 큰할머니 / 정감 있는 베테랑 해녀 삼춘 / 진중하고 품격 있는 수호신 돌하르방)에 맞는 자연스러운 말투를 유지하세요.
3. 외지인이 듣기에 어색함이 전혀 없고 귀에 쏙쏙 들어오는 유려한 구술체로 서술하세요.
4. 절대 RAG 지식베이스에 없는 허위 사실을 날조하지 마세요.
`;
  }
}
