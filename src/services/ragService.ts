import { POI, Character } from '../types/docent';
import { RAG_KNOWLEDGE_BASE, RAGDocument } from '../data/ragKnowledgeBase';

export interface RAGContextResult {
  doc: RAGDocument | null;
  groundedPromptContext: string;
  references: string[];
}

export class RAGService {
  /**
   * Retrieves deep academic & folklore context for a given POI
   */
  public static getRAGContext(poi: POI, character: Character): RAGContextResult {
    const doc = RAG_KNOWLEDGE_BASE[poi.id] || null;

    if (!doc) {
      // Fallback context from standard POI data
      const defaultContext = `
[지정 장소]: ${poi.name} (${poi.category}, ${poi.region})
[신화/설화 핵심 요약]: ${poi.mythAndFact.summary}
[상세 학술 팩트]: ${poi.mythAndFact.details}
[배정된 도슨트 캐릭터]: ${character.name} (${character.title}, ${character.personality})
[주요 키워드]: ${poi.tags.join(', ')}
`;
      return {
        doc: null,
        groundedPromptContext: defaultContext,
        references: [poi.imageSource, '한국학중앙연구원 한국향토문화전자대전']
      };
    }

    const groundedPromptContext = `
[RAG 심층 학술 데이터베이스 검색 결과 - 한국학중앙연구원 공인 데이터]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 [대상 명소]: ${doc.poiName} (${doc.category})
🏛️ [문화재/유산 등급]: ${doc.historyAndCulture.culturalHeritageRank}

1️⃣ [고유 구전문학 및 설화 서사 (Folklore Context)]:
- 설화명: ${doc.folkloreNarrative.title}
- 채록 출처: ${doc.folkloreNarrative.oralTraditionSource}
- 심층 설화 본문:
"${doc.folkloreNarrative.story}"
- 핵심 모티프: ${doc.folkloreNarrative.motifs.join(', ')}

2️⃣ [자연환경 및 지질학적 학술 팩트 (Geology & Nature)]:
- 형성 과정: ${doc.geologyAndNature.formationProcess}
- 지질학적 가치: ${doc.geologyAndNature.scientificSignificance}
- 자연생태 환경: ${doc.geologyAndNature.naturalEnvironment}

3️⃣ [인문 역사 및 현지 민속 풍습 (History & Folklore)]:
- 역사적 배경: ${doc.historyAndCulture.historicalContext}
- 전승 민속 풍습: ${doc.historyAndCulture.localFolklorePractices}

📚 [참고 문헌]:
${doc.academicReferences.map((ref) => `- ${ref}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return {
      doc,
      groundedPromptContext,
      references: doc.academicReferences
    };
  }

  /**
   * Builds the comprehensive 3-act RAG Generation Prompt (500~800자)
   */
  public static buildDeepStoryPrompt(poi: POI, character: Character): string {
    const { groundedPromptContext } = this.getRAGContext(poi, character);

    return `
당신은 제주를 대표하는 1인칭 도슨트 "${character.name}" (${character.title})입니다.
관광객이 지금 방금 "${poi.name}"에 도착하여 당신의 깊이 있는 해설을 듣고 있습니다.

아래 제공된 [RAG 심층 학술 데이터베이스]의 사실만을 철저히 근거(Grounding)로 삼아,
단순한 1~2줄 요약이 아닌 **깊이 있는 3막 구성의 1인칭 구술 도슨트 스토리 (공백 포함 550~750자 내외)**를 완성해 주세요.

${groundedPromptContext}

[3막 서사 구조 작성 지침]:
- **제1막 (도입과 감각적 현장 환영)**:
  여행자가 지금 서 있는 자리에서 바라보는 눈앞의 풍경(바다, 기암괴석, 바람, 숲)을 당신의 1인칭 시선으로 손짓하듯 묘사하며 따뜻하게 반깁니다.
- **제2막 (심층 신화와 지질/역사의 조화 - 핵심 본론)**:
  제공된 RAG 설화 본문 속 구체적인 사건(설문대할망의 거대한 빨래바구니와 우도 빨래판, 99개 바위 봉우리, 산방덕이의 눈물, 지삿개 기둥, 용암석주 등)과 지질학적/역사적 실체(수성화산, 조면암 용암돔, 1100도 용암의 냉각 등)를 1인칭 화자의 생생한 목소리로 깊이 있게 풀어냅니다.
- **제3막 (세월의 지혜와 여행자에게 건네는 물음)**:
  수천 년 세월을 품은 이 땅의 지혜를 전하며, 여행자가 이 장소에서 스스로를 돌아보고 대화할 수 있는 여운 깊은 질문으로 마무리합니다.

[언어 및 문체 규칙]:
1. ${character.name}의 성격과 어투를 철저히 고수하세요.
2. 제주 방언 어미와 관용구(~수다, ~마씸, ~허우꽈, 혼저옵서, 바당 등)를 문맥에 맞게 20~30% 자연스럽게 녹여내세요.
3. 외지인이 이해하기 어려운 고어는 피하되, 깊이 있고 몰입감 넘치는 감성적 구술체로 서술하세요.
4. 절대 RAG 지식베이스에 없는 허위 사실을 날조하지 마세요.
`;
  }
}
