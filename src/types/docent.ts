export type CharacterId = 'summaryAgent' | 'seolmundae' | 'haenyeo' | 'harubang' | 'dolhareubang';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  avatarEmoji: string;
  avatarUrl?: string;
  badgeColor: string;
  accentColor: string;
  personality: string;
  greeting: string;
  dialectSummary: string;
  systemPrompt: string;
}

export interface POIImage {
  src: string;
  alt: string;
  source?: string;
  sourceUrl?: string;
}

export type POICategory = '관광지' | '축제' | '설화' | '인물' | '문화유산' | '음식' | '교육';

/**
 * 한국향토문화전자대전 학술 문서. 예전에는 src/data/ragKnowledgeBase.ts 에서
 * 10MB 짜리 상수와 함께 export 됐지만, 이제 POI 상세 조각에 실려 온다.
 */
export interface RAGDocument {
  id?: string;
  poiId: string;
  poiName?: string;
  title?: string;
  category: string;
  region?: string;
  summary?: string;
  content?: string;
  source?: string;
  sourceUrl?: string;
  assignedCharacterId?: string;
  metadata?: Record<string, any>;
  folkloreNarrative?: { title: string; story: string; motifs: string[]; oralTraditionSource: string };
  geologyAndNature?: { formationProcess: string; scientificSignificance: string; naturalEnvironment: string };
  historyAndCulture?: { culturalHeritageRank: string; historicalContext: string; localFolklorePractices: string };
  academicReferences?: string[];
}

/**
 * 목록·검색·지도에 필요한 최소 필드. poi-index.json(gzip 62KB)으로 부팅 시 1회 받는다.
 */
export interface POISummary {
  id: string;
  name: string;
  category: POICategory | string;
  assignedCharacterId: CharacterId;
  region: string;
  latitude: number;
  longitude: number;
  tags: string[];
}

/**
 * 카루셀 카드 렌더 + 시트 내 검색용 데이터. poi-cards.json 으로 시트 첫 오픈 시 1회.
 * mythAndFact.details 는 제외한다 (gzip 329KB → 1.5MB). 본문 검색은 백엔드 담당.
 */
export interface POICard {
  imageUrl: string;
  summary: string;
  mythTitle: string;
  sampleQuestions: string[];
}

/** POI 선택 시 poi/{id}.json 으로 받는 상세 조각. */
export interface POIDetail {
  id: string;
  imageUrl: string;
  images?: POIImage[];
  imageTitle: string;
  imageSource: string;
  sourceUrl?: string;
  mythAndFact: {
    mythTitle?: string;
    summary: string;
    details: string;
  };
  sampleQuestions: string[];
  ragDocument?: RAGDocument | null;
}

/** 요약 + 상세를 합친 완전한 POI. 화면 컴포넌트가 다루는 단위. */
export type POI = POISummary & Omit<POIDetail, 'id'> & { id: string };

export interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
  characterId?: CharacterId;
}

export interface BenchmarkMetrics {
  engine: 'engine_a' | 'engine_b';
  engineName: string;
  searchLatencyMs: number;
  ttftMs: number; // Time to first token
  totalLatencyMs: number;
  memoryEstimateKb: number;
}
