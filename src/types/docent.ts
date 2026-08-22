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

export interface POI {
  id: string;
  name: string;
  category: POICategory | string;
  assignedCharacterId: CharacterId;
  region: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  images?: POIImage[];
  imageTitle: string;
  imageSource: string;
  sourceUrl?: string;
  tags: string[];
  mythAndFact: {
    mythTitle?: string;
    summary: string;
    details: string;
  };
  sampleQuestions: string[];
}

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
