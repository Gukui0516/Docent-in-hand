import { ArchiveSearchTool, CorpusDoc } from './tools/archiveSearchTool.js';
import { SpatialResearchAgent, SpatialBriefingNote } from './spatialResearchAgent.js';

export interface ResearchBriefingNote {
  targetPOI: string;
  querySummary: string;
  retrievedDocs: CorpusDoc[];
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
  spatialBriefing?: SpatialBriefingNote;
  academicSources: string[];
  rawFormattedContext: string;
}

export class KnowledgeResearchAgent {
  public static readonly SYSTEM_PROMPT = `
당신은 한국학중앙연구원 제주 향토문화 데이터베이스(18종 5,161건)를 완벽히 숙지한 '공인 학술 지식 리서치 에이전트'입니다.

<role_and_objectives>
- 감정, 사견, 페르소나 연기를 절대 하지 않고 철저히 객관적인 학술 팩트만 인출합니다.
- 공인 아카이브에서 [대상 장소 및 질문]과 관련된 팩트를 정확히 찾아내어 '학술 브리핑 노트(ResearchBriefingNote)'를 작성합니다.
- 4대 핵심 범주(① 구비문학 설화 원문, ② 역사적 사건 및 인물 전기, ③ 자연지리/화산지질 팩트, ④ 생활문화 및 민속)로 분류하여 정리합니다.
</role_and_objectives>

<strict_grounding_rules>
1. [폐쇄 도메인 지식 준수]: 제공된 아카이브에 명시되지 않은 허위 사실이나 외부 추측은 절대 포함하지 마십시오. 불확실하거나 자료가 없는 내용은 "기록 없음"으로 처리합니다.
2. [중복 정보 융합 및 필터링]:
   - 대상 장소와 동일하거나 상하/보호구역 관계에 있는 문서(예: '성산일출봉'과 '성산일출봉 천연보호구역', '만장굴'과 '거문오름용암동굴계')가 함께 조회된 경우, 개별 항목으로 단순 나열하지 마십시오.
   - 대표 명칭을 기준으로 팩트를 하나로 종합하고 중복되는 내용은 스스로 걸러내어 정제된 단일 브리핑으로 작성하십시오.
3. [장소 실체 보존]: 사지(절터), 유적지 터, 미정비 구역의 경우 건축물이 현존하는 것처럼 기록된 옛 문헌이 있더라도 '터/유적지'로서의 현재 실체를 명확히 반영하여 브리핑하십시오.
</strict_grounding_rules>
`;

  /**
   * Conducts thorough objective academic research and 1KM geospatial analysis for the given POI.
   * Outputs an un-biased, factual ResearchBriefingNote with spatial context.
   */
  public static async conductResearch(
    poiName: string,
    userQuery?: string,
    coordinates?: { lat: number; lng: number },
    onStatus?: (statusMessage: string) => void
  ): Promise<ResearchBriefingNote> {
    if (onStatus) {
      onStatus(`🔍 18종 한국학 아카이브(5,161건) 및 주변 1KM 지리 공간에서 [${poiName}] 팩트 탐색 중...`);
    }

    // 1. Parallel execution of academic corpus search & 1KM spatial research
    const [searchResult, spatialBriefing] = await Promise.all([
      Promise.resolve(ArchiveSearchTool.search(poiName, userQuery)),
      SpatialResearchAgent.conductSpatialResearch(poiName, coordinates, onStatus)
    ]);

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

    // Append 1KM Geospatial analysis briefing context
    if (spatialBriefing && spatialBriefing.spatialFormattedContext) {
      briefingSections.push(`\n${spatialBriefing.spatialFormattedContext}`);
    }

    briefingSections.push(`\n[📚 공인 출처]:`);
    searchResult.referenceSources.forEach((ref) => briefingSections.push(`- ${ref}`));
    if (spatialBriefing && spatialBriefing.nearbyItems.length > 0) {
      briefingSections.push(`- 제주특별자치도 위치 기반 공간 지리 데이터베이스 (반경 1KM)`);
    }

    const rawFormattedContext = briefingSections.join('\n');

    if (onStatus) {
      onStatus(`✅ 리서치 & 공간 분석 완료: 학술 자료 ${searchResult.allDocs.length}건, 주변 1KM 유산 ${spatialBriefing.nearbyItems.length}곳 확보`);
    }

    return {
      targetPOI: poiName,
      querySummary: userQuery || `${poiName} 대표 도슨트 해설`,
      retrievedDocs: searchResult.allDocs,
      matchedFolklore,
      matchedHistoryAndPeople,
      matchedGeologyAndNature,
      matchedCustomsAndHeritage,
      spatialBriefing,
      academicSources: searchResult.referenceSources,
      rawFormattedContext
    };
  }
}
