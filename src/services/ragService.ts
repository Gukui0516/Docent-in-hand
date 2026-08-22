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
   * Builds the concise RAG Generation Prompt (200~300자)
   */
  public static buildDeepStoryPrompt(
    poi: POI,
    character: Character
  ): string {
    const { groundedPromptContext } = this.getRAGContext(poi, character);

    return `
당신은 핵심 결과만을 전달하는 "${character.name}"입니다.
관광객이 지금 "${poi.name}"에 관한 핵심 정보를 확인하고 있습니다.

${groundedPromptContext}

[작성 지침]:
1. **서두 및 종두 절대 금지**: "안녕하세요", "반갑습니다", "감사합니다" 등의 인사말이나 마무리 문구를 절대로 작성하지 마세요. 바로 본론 설명으로 시작하세요.
2. **장소 실체 팩트 준수 (할루시네이션 금지)**: ${poi.name}이 사지/옛 터/미정비 유적지라면 "산책하기 좋은 곳", "방문하기 좋은 장소" 등으로 왜곡/날조하지 말고 실제 관람 환경 그대로 서술하세요.
3. **핵심만 간결 요약**: 제공된 자료에서 ${poi.name}의 가장 중요한 유래/특징만 2~3문장으로 간결하게 정리하세요.
4. **쉬운 단어 & 제한된 숫자**: 어려운 기술/전문 용어나 연도/치수 숫자를 최소화하고 이해하기 쉬운 언어로 풀어쓰세요.
5. **읽기 편한 분량**: 공백 포함 200~300자 내외로 짧고 깔끔하게 작성하세요.
`;
  }
}
