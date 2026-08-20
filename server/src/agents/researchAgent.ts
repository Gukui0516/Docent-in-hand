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
