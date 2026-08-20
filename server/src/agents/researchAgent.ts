import { ArchiveSearchTool, ArchiveSearchResult } from './tools/archiveSearchTool.js';

export interface ResearchBriefingNote {
  targetPOI: string;
  querySummary: string;
  matchedFolklore: {
    title: string;
    storyExcerpt: string;
    source: string;
  }[];
  matchedHistoryAndPeople: {
    title: string;
    historicalFacts: string;
  }[];
  matchedGeologyAndNature: {
    title: string;
    scientificFacts: string;
  }[];
  matchedCustomsAndHeritage: {
    title: string;
    folklorePractices: string;
  }[];
  academicSources: string[];
  rawFormattedContext: string;
}

export class KnowledgeResearchAgent {
  public static readonly SYSTEM_PROMPT = `
당신은 한국학중앙연구원 제주 향토문화 데이터베이스를 완벽히 숙지한 '공인 학술 지식 리서치 에이전트'입니다.

[역할과 원칙]:
1. 감정, 사견, 페르소나 연기(~이우다, 할머니 말투 등)를 절대 하지 마십시오.
2. 당신의 유일한 목표는 제공된 18종 5,161건의 한국학 공인 아카이브에서 [대상 장소 및 사용자 질문]과 관련된 팩트를 정확히 찾아내어 '학술 브리핑 노트(ResearchBriefingNote)'를 작성하는 것입니다.
3. 4대 핵심 범주(① 구비문학 설화 원문, ② 역사적 사건 및 인물 전기, ③ 자연지리/화산지질 팩트, ④ 생활문화 및 민속)로 분류하여 정리하십시오.
4. 아카이브에 없는 허위 사실이나 추측은 절대 포함하지 마십시오. 불확실한 내용은 "기록 없음"으로 명시하십시오.
`;

  /**
   * Conducts thorough objective academic research across 18 categories for the given POI and user question.
   * Outputs an un-biased, factual ResearchBriefingNote.
   */
  public static async conductResearch(
    poiName: string,
    userQuery?: string,
    onStatus?: (statusMessage: string) => void
  ): Promise<ResearchBriefingNote> {
    if (onStatus) {
      onStatus(`🔍 18종 한국학 아카이브(3,285건)에서 [${poiName}] 관련 설화·역사·인물 탐색 중...`);
    }

    const searchResult: ArchiveSearchResult = ArchiveSearchTool.search(poiName, userQuery);

    const matchedFolklore = searchResult.folkloreDocs.map((d) => ({
      title: d.title,
      storyExcerpt: d.content ? d.content.slice(0, 600) : d.summary,
      source: `한국향토문화전자대전 - ${d.title}`
    }));

    const matchedHistoryAndPeople = searchResult.historyDocs.map((d) => ({
      title: d.title,
      historicalFacts: d.content ? d.content.slice(0, 500) : d.summary
    }));

    const matchedGeologyAndNature = searchResult.geologyDocs.map((d) => ({
      title: d.title,
      scientificFacts: d.content ? d.content.slice(0, 500) : d.summary
    }));

    const matchedCustomsAndHeritage = searchResult.customsDocs.map((d) => ({
      title: d.title,
      folklorePractices: d.content ? d.content.slice(0, 500) : d.summary
    }));

    // Format a clean, structured briefing string for Layer 2 Persona Agents
    const briefingSections: string[] = [];

    briefingSections.push(`[📋 지식 리서치 에이전트 학술 브리핑 노트]`);
    briefingSections.push(`- 대상 장소: ${poiName}`);
    if (userQuery) {
      briefingSections.push(`- 관광객 세부 질문: "${userQuery}"`);
    }

    if (matchedFolklore.length > 0) {
      briefingSections.push(`\n[📜 검증된 구전문학 / 설화 원문 기록]`);
      matchedFolklore.forEach((f) => {
        briefingSections.push(`• [${f.title}]: ${f.storyExcerpt}`);
      });
    }

    if (matchedHistoryAndPeople.length > 0) {
      briefingSections.push(`\n[👑 검증된 역사적 사건 / 인물 전기 기록]`);
      matchedHistoryAndPeople.forEach((h) => {
        briefingSections.push(`• [${h.title}]: ${h.historicalFacts}`);
      });
    }

    if (matchedGeologyAndNature.length > 0) {
      briefingSections.push(`\n[🌋 검증된 화산 지질학 / 자연생태 팩트]`);
      matchedGeologyAndNature.forEach((g) => {
        briefingSections.push(`• [${g.title}]: ${g.scientificFacts}`);
      });
    }

    if (matchedCustomsAndHeritage.length > 0) {
      briefingSections.push(`\n[🤿 검증된 생활민속 / 문화재 지정 기록]`);
      matchedCustomsAndHeritage.forEach((c) => {
        briefingSections.push(`• [${c.title}]: ${c.folklorePractices}`);
      });
    }

    briefingSections.push(`\n[📚 공인 출처]:`);
    searchResult.referenceSources.forEach((ref) => briefingSections.push(`- ${ref}`));

    const rawFormattedContext = briefingSections.join('\n');

    if (onStatus) {
      onStatus(`✅ 리서치 완료: 총 ${searchResult.allDocs.length}건의 공인 학술 자료 확보`);
    }

    return {
      targetPOI: poiName,
      querySummary: userQuery || `${poiName} 대표 도슨트 해설`,
      matchedFolklore,
      matchedHistoryAndPeople,
      matchedGeologyAndNature,
      matchedCustomsAndHeritage,
      academicSources: searchResult.referenceSources,
      rawFormattedContext
    };
  }
}
