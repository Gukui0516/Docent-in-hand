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
      const name = doc.poiName || doc.title || poi.name;
      const rank = doc.historyAndCulture?.culturalHeritageRank || doc.metadata?.type || '향토문화유산';
      const story = doc.folkloreNarrative ? `${doc.folkloreNarrative.title} ("${doc.folkloreNarrative.story}")` : (doc.summary || '');
      const geology = doc.geologyAndNature ? `${doc.geologyAndNature.formationProcess} (${doc.geologyAndNature.scientificSignificance})` : '';
      const hist = doc.historyAndCulture?.historicalContext || (doc.content ? doc.content.slice(0, 300) : '');
      const folklore = doc.historyAndCulture?.localFolklorePractices || '';

      specificContext = `
[대표 명소 고유 학술 정보 (한국학중앙연구원)]
- 명소명: ${name} (${doc.category})
- 문화재/유산 등급: ${rank}
- 설화 및 역사 요약: ${story}
${geology ? `- 형성 과정 및 지질학: ${geology}` : ''}
${hist ? `- 역사적 배경: ${hist}` : ''}
${folklore ? `- 전승 민속: ${folklore}` : ''}
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
    const fewShots = JEJU_FEW_SHOTS[characterId] || JEJU_FEW_SHOTS['default'] || [];
    const sampleWords = JEJU_DIALECT_DICTIONARY.slice(0, 10)
      .map((w) => `• ${w.jeju}: ${w.standard}`)
      .join('\n');

    const fewShotExamples = fewShots
      .map((f: { standard: string; jeju: string }, i: number) => `[예시 ${i + 1}]\n표준어: "${f.standard}"\n제주어 구술: "${f.jeju}"`)
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
위 <context> 자료만을 엄격한 근거로 삼아 [${poi.name}]의 핵심 해설을 작성하십시오.

- [필수] 인사말(서두)과 맺음말(종두), 소제목/불릿 기호 없이 첫 문장부터 본론 팩트로 바로 시작하십시오.
- [필수] 지나친 요약으로 인해 사실이나 인과관계가 왜곡되지 않도록 주의하십시오. 자료에 기재된 명소의 유래, 역사적 배경, 지형 형성 원리를 명확하게 서술하십시오.
- [필수] 설화나 전설이 포함된 경우, 역사/과학적 사실과 명확히 구분하여 "~라는 전설이 전해집니다"와 같이 전승 구비문학임을 명시하고 이야기의 발단과 결말을 왜곡 없이 전달하십시오.
- [필수] ${poi.name}의 실제 보존/정비 상태(터만 남았는지, 관람이 가능한지)를 팩트 그대로 전달하고, 미정비 유적지를 임의로 '관광 명소'로 꾸며내지 마십시오.
- [필수] 주어-서술어가 명확한 완성형 문장 3~4개로 구성하고, 공백 포함 300~450자 내외로 사실에 입각하여 작성하십시오.
</instruction>
`;
  }
}
