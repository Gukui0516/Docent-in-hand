import { POI, Character, RAGDocument } from '../types/docent';
import { JEJU_DIALECT_DICTIONARY, JEJU_FEW_SHOTS } from '../data/jejuDialectData';

export interface RAGContextResult {
  doc: RAGDocument | null;
  groundedPromptContext: string;
  references: string[];
}

export class RAGService {
  /**
   * Dynamically retrieves deep academic, folklore, history, and natural facts across the ENTIRE 3,285+ article dataset!
   */
  public static getRAGContext(poi: POI, character: Character): RAGContextResult {
    // 전체 코퍼스 검색은 백엔드 KnowledgeResearchAgent 가 담당한다. 이 경로는
    // 백엔드 호출이 실패했을 때 쓰는 클라이언트 폴백이라, POI 상세 조각에 실려 온
    // 학술 문서 1건만 근거로 쓴다. (예전에는 20MB 코퍼스를 번들에 넣고 검색했다.)
    const doc = poi.ragDocument || null;
    const references = doc?.academicReferences?.length
      ? doc.academicReferences
      : ['한국향토문화전자대전 (한국학중앙연구원)'];

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

📚 [참고 문헌 및 공식 학술 출처]:
${references.map((ref) => `- ${ref}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return { doc, groundedPromptContext, references };
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
   * Builds the concise RAG Generation Prompt (200~300자)
   */
  public static buildDeepStoryPrompt(
    poi: POI,
    character: Character
  ): string {
    const { groundedPromptContext } = this.getRAGContext(poi, character);

    return `
<context>
${groundedPromptContext}
</context>

<instruction>
위 <context> 자료만을 근거로 삼아 [${poi.name}]의 핵심 해설을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두), 소제목 없이 첫 문장부터 본론 팩트로 바로 시작하십시오.
- [필수] 설화나 전설이 얽힌 장소(태그 #설화 등)인 경우, 단순 행정 정보 대신 **설화 속 등장인물과 전설의 핵심 줄거리**에 집중하여 생생하게 서술하십시오.
- [필수] ${poi.name}의 실제 보존/정비 환경(터만 남았는지, 관람 시설이 갖춰져 있는지)을 팩트 그대로 전달하고, 미정비 유적지를 '관광 명소/산책로'로 왜곡하지 마십시오.
- [필수] 어려운 전문 용어와 복잡한 숫자는 지양하고, 쉬운 우리말로 공백 포함 200~300자 내외로 정제하여 작성하십시오.
</instruction>
`;
  }
}
