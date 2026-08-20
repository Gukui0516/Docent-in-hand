import { POI } from '../types/docent';
import fullCorpusData from '../data/ragFullCorpus.json';

export interface CorpusDoc {
  id: string;
  title: string;
  category: string;
  region: string;
  subcats: string[];
  summary: string;
  content: string;
}

export interface CategorizedRAGResult {
  folkloreDocs: CorpusDoc[];
  historyAndPeopleDocs: CorpusDoc[];
  natureAndGeologyDocs: CorpusDoc[];
  customsAndHeritageDocs: CorpusDoc[];
  allMatchedDocs: CorpusDoc[];
  formattedContext: string;
  referenceSources: string[];
}

const CORPUS: CorpusDoc[] = fullCorpusData as CorpusDoc[];

export class FullRagSearchEngine {
  /**
   * Searches the entire 3,285+ academic dataset across all 18 categories for related folklore, history, nature, and customs
   */
  public static retrieveComprehensiveContext(
    poi: POI,
    userQuery?: string,
    topKPerCategory: number = 2
  ): CategorizedRAGResult {
    const poiKeywords = this.extractKeywords(poi, userQuery);

    const scoredDocs: { doc: CorpusDoc; score: number }[] = [];

    for (const doc of CORPUS) {
      const score = this.calculateRelevance(doc, poi, poiKeywords, userQuery);
      if (score > 12) {
        scoredDocs.push({ doc, score });
      }
    }

    scoredDocs.sort((a, b) => b.score - a.score);

    const folkloreDocs: CorpusDoc[] = [];
    const historyAndPeopleDocs: CorpusDoc[] = [];
    const natureAndGeologyDocs: CorpusDoc[] = [];
    const customsAndHeritageDocs: CorpusDoc[] = [];
    const seenIds = new Set<string>();

    for (const { doc } of scoredDocs) {
      if (seenIds.has(doc.id)) continue;

      const cat = doc.category;
      const sub = doc.subcats.join(' ');

      if (
        (cat.includes('언어') || cat.includes('문학') || cat.includes('구비전승') || doc.title.includes('「') || doc.title.includes('설화') || doc.title.includes('전설')) &&
        folkloreDocs.length < topKPerCategory
      ) {
        folkloreDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('성씨') || cat.includes('인물') || cat.includes('역사') || sub.includes('인물') || sub.includes('역사')) &&
        historyAndPeopleDocs.length < topKPerCategory
      ) {
        historyAndPeopleDocs.length < topKPerCategory && historyAndPeopleDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('자연') || cat.includes('지리') || sub.includes('지형') || sub.includes('지질')) &&
        natureAndGeologyDocs.length < topKPerCategory
      ) {
        natureAndGeologyDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('문화유산') || cat.includes('생활') || cat.includes('민속') || cat.includes('종교')) &&
        customsAndHeritageDocs.length < topKPerCategory
      ) {
        customsAndHeritageDocs.push(doc);
        seenIds.add(doc.id);
      }
    }

    // Top remaining general matches if some categories were sparse
    const allMatchedDocs = [
      ...folkloreDocs,
      ...historyAndPeopleDocs,
      ...natureAndGeologyDocs,
      ...customsAndHeritageDocs
    ];

    if (allMatchedDocs.length < 4) {
      for (const { doc } of scoredDocs) {
        if (!seenIds.has(doc.id) && allMatchedDocs.length < 6) {
          allMatchedDocs.push(doc);
          seenIds.add(doc.id);
        }
      }
    }

    const formattedContext = this.formatGroundedContext(
      poi,
      folkloreDocs,
      historyAndPeopleDocs,
      natureAndGeologyDocs,
      customsAndHeritageDocs,
      allMatchedDocs
    );

    const referenceSources = Array.from(
      new Set([
        '한국향토문화전자대전 (한국학중앙연구원)',
        ...allMatchedDocs.map((d) => `[${d.category}] ${d.title}`)
      ])
    );

    return {
      folkloreDocs,
      historyAndPeopleDocs,
      natureAndGeologyDocs,
      customsAndHeritageDocs,
      allMatchedDocs,
      formattedContext,
      referenceSources
    };
  }

  private static extractKeywords(poi: POI, userQuery?: string): string[] {
    const keywords = new Set<string>();

    // Add core POI names and words
    poi.name.split(/[\s&()·,]+/).forEach((w) => w.length >= 2 && keywords.add(w));
    if (poi.region) {
      poi.region.split(/\s+/).forEach((w) => w.length >= 2 && keywords.add(w));
    }

    // Add tags
    poi.tags.forEach((t) => keywords.add(t));

    // Add myth title keywords
    if (poi.mythAndFact?.mythTitle) {
      poi.mythAndFact.mythTitle.split(/[\s&()·,]+/).forEach((w) => w.length >= 2 && keywords.add(w));
    }

    // Add user query terms if provided
    if (userQuery) {
      userQuery.split(/[\s?!.,]+/).forEach((w) => w.length >= 2 && keywords.add(w));
    }

    return Array.from(keywords);
  }

  private static calculateRelevance(
    doc: CorpusDoc,
    poi: POI,
    keywords: string[],
    userQuery?: string
  ): number {
    let score = 0;
    const docTitle = doc.title;
    const docSummary = doc.summary;
    const docContent = doc.content;
    const docSubcats = doc.subcats.join(' ');

    // 1. Direct POI Name Match
    if (docTitle.includes(poi.name) || poi.name.includes(docTitle)) {
      score += 150;
    }

    // 2. Exact user query match in title
    if (userQuery && userQuery.length >= 2 && docTitle.includes(userQuery)) {
      score += 80;
    }

    // 3. Keyword Scoring across Title, Subcategories, Summary, and Content
    for (const kw of keywords) {
      if (!kw || kw.length < 2) continue;

      if (docTitle.includes(kw)) {
        score += 35;
      }
      if (docSubcats.includes(kw)) {
        score += 15;
      }
      if (docSummary.includes(kw)) {
        score += 12;
      }
      if (docContent.includes(kw)) {
        // Count occurrences up to a cap
        const count = (docContent.match(new RegExp(kw, 'g')) || []).length;
        score += Math.min(count * 2, 16);
      }
    }

    // 4. Boost for high-value cultural categories
    if (doc.category.includes('언어') || doc.category.includes('문학') || doc.category.includes('구비전승')) {
      score *= 1.2;
    } else if (doc.category.includes('문화유산') || doc.category.includes('역사')) {
      score *= 1.15;
    }

    return score;
  }

  private static formatGroundedContext(
    poi: POI,
    folkloreDocs: CorpusDoc[],
    historyDocs: CorpusDoc[],
    natureDocs: CorpusDoc[],
    customsDocs: CorpusDoc[],
    allDocs: CorpusDoc[]
  ): string {
    const sections: string[] = [];

    sections.push(`[🏛️ 대상 장소 기본 정보]`);
    sections.push(`- 명소명: ${poi.name} (${poi.category}, ${poi.region})`);
    sections.push(`- 지정 핵심 테마: ${poi.mythAndFact.mythTitle}`);
    sections.push(`- 태그: ${poi.tags.join(', ')}`);

    if (folkloreDocs.length > 0) {
      sections.push(`\n[📜 한국학중앙연구원 공인 구전문학 / 설화 / 전설 원문 기록]`);
      for (const d of folkloreDocs) {
        sections.push(`▶ [${d.title}] (${d.category})`);
        if (d.summary) sections.push(`- 요약: ${d.summary}`);
        if (d.content) sections.push(`- 설화 및 전승 내용:\n${d.content.slice(0, 700)}...`);
      }
    }

    if (historyDocs.length > 0) {
      sections.push(`\n[👑 역사적 사건 / 관련 인물 / 문화유산 기록]`);
      for (const d of historyDocs) {
        sections.push(`▶ [${d.title}] (${d.category})`);
        if (d.summary) sections.push(`- 요약: ${d.summary}`);
        if (d.content) sections.push(`- 역사적 사실:\n${d.content.slice(0, 600)}...`);
      }
    }

    if (natureDocs.length > 0) {
      sections.push(`\n[🌋 자연지리 / 화산 지질학 / 생태 환경 팩트]`);
      for (const d of natureDocs) {
        sections.push(`▶ [${d.title}] (${d.category})`);
        if (d.summary) sections.push(`- 요약: ${d.summary}`);
        if (d.content) sections.push(`- 지질 및 자연환경:\n${d.content.slice(0, 600)}...`);
      }
    }

    if (customsDocs.length > 0) {
      sections.push(`\n[🤿 현지 생활문화 / 민속 풍습 / 문화재 기록]`);
      for (const d of customsDocs) {
        sections.push(`▶ [${d.title}] (${d.category})`);
        if (d.summary) sections.push(`- 요약: ${d.summary}`);
        if (d.content) sections.push(`- 민속 및 문화재 상세:\n${d.content.slice(0, 600)}...`);
      }
    }

    if (allDocs.length === 0) {
      sections.push(`\n[기본 요약 기록]`);
      sections.push(poi.mythAndFact.details);
    }

    return sections.join('\n');
  }
}
