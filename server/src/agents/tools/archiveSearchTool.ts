import { loadJson } from '../../data/gcsSource.js';

export interface CorpusDoc {
  id: string;
  title: string;
  category: string;
  region: string;
  subcats: string[];
  summary: string;
  content: string;
}

export interface ArchiveSearchResult {
  folkloreDocs: CorpusDoc[];
  historyDocs: CorpusDoc[];
  geologyDocs: CorpusDoc[];
  customsDocs: CorpusDoc[];
  allDocs: CorpusDoc[];
  referenceSources: string[];
}

let CORPUS: CorpusDoc[] = [];

/**
 * 코퍼스를 적재한다. 반드시 app.listen() 이전에 await 해야 한다 —
 * Cloud Run 은 포트가 열리는 즉시 트래픽을 보내므로, 준비 전에 리스닝하면
 * 첫 요청이 빈 코퍼스를 만나 근거 없는 답변이 나간다.
 */
export async function initArchiveCorpus(): Promise<number> {
  const docs = await loadJson<CorpusDoc[]>(
    process.env.CORPUS_URI,
    ['src/data/ragFullCorpus.json', '../src/data/ragFullCorpus.json'],
    'corpus'
  );
  CORPUS = docs ?? [];
  return CORPUS.length;
}

export const getCorpusSize = () => CORPUS.length;

export class ArchiveSearchTool {
  /**
   * Searches the entire 3,285+ academic database across 18 categories
   */
  public static search(
    poiName: string,
    query?: string,
    topKPerCategory: number = 2
  ): ArchiveSearchResult {
    const keywords = this.extractKeywords(poiName, query);
    const scoredDocs: { doc: CorpusDoc; score: number }[] = [];

    for (const doc of CORPUS) {
      const score = this.scoreDoc(doc, poiName, keywords, query);
      if (score > 12) {
        scoredDocs.push({ doc, score });
      }
    }

    scoredDocs.sort((a, b) => b.score - a.score);

    const folkloreDocs: CorpusDoc[] = [];
    const historyDocs: CorpusDoc[] = [];
    const geologyDocs: CorpusDoc[] = [];
    const customsDocs: CorpusDoc[] = [];
    const seenIds = new Set<string>();

    for (const { doc } of scoredDocs) {
      if (seenIds.has(doc.id)) continue;

      const cat = doc.category;
      const sub = doc.subcats.join(' ');

      if (
        (cat.includes('언어') || cat.includes('문학') || cat.includes('구비전승') || doc.title.includes('「') || doc.title.includes('설화')) &&
        folkloreDocs.length < topKPerCategory
      ) {
        folkloreDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('성씨') || cat.includes('인물') || cat.includes('역사') || sub.includes('인물')) &&
        historyDocs.length < topKPerCategory
      ) {
        historyDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('자연') || cat.includes('지리') || sub.includes('지형') || sub.includes('지질')) &&
        geologyDocs.length < topKPerCategory
      ) {
        geologyDocs.push(doc);
        seenIds.add(doc.id);
      } else if (
        (cat.includes('문화유산') || cat.includes('생활') || cat.includes('민속') || cat.includes('종교')) &&
        customsDocs.length < topKPerCategory
      ) {
        customsDocs.push(doc);
        seenIds.add(doc.id);
      }
    }

    const allDocs = [...folkloreDocs, ...historyDocs, ...geologyDocs, ...customsDocs];

    if (allDocs.length < 4) {
      for (const { doc } of scoredDocs) {
        if (!seenIds.has(doc.id) && allDocs.length < 6) {
          allDocs.push(doc);
          seenIds.add(doc.id);
        }
      }
    }

    const referenceSources = Array.from(
      new Set([
        '한국향토문화전자대전 (한국학중앙연구원)',
        ...allDocs.map((d) => `[${d.category}] ${d.title}`)
      ])
    );

    return {
      folkloreDocs,
      historyDocs,
      geologyDocs,
      customsDocs,
      allDocs,
      referenceSources
    };
  }

  private static extractKeywords(poiName: string, query?: string): string[] {
    const set = new Set<string>();
    poiName.split(/[\s&()·,]+/).forEach((w) => w.length >= 2 && set.add(w));
    if (query) {
      query.split(/[\s?!.,]+/).forEach((w) => w.length >= 2 && set.add(w));
    }
    return Array.from(set);
  }

  private static scoreDoc(
    doc: CorpusDoc,
    poiName: string,
    keywords: string[],
    query?: string
  ): number {
    let score = 0;
    const { title, summary, content, subcats, category } = doc;
    const subStr = subcats.join(' ');

    if (title.includes(poiName) || poiName.includes(title)) score += 150;
    if (query && query.length >= 2 && title.includes(query)) score += 80;

    for (const kw of keywords) {
      if (title.includes(kw)) score += 35;
      if (subStr.includes(kw)) score += 15;
      if (summary.includes(kw)) score += 12;
      if (content.includes(kw)) {
        const c = (content.match(new RegExp(kw, 'g')) || []).length;
        score += Math.min(c * 2, 16);
      }
    }

    if (category.includes('언어') || category.includes('문학') || category.includes('구비전승')) {
      score *= 1.2;
    } else if (category.includes('문화유산') || category.includes('역사')) {
      score *= 1.15;
    }

    return score;
  }
}
