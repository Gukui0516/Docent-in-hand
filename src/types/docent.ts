export type CharacterId = 'docent' | 'standard' | 'seolmundae' | 'haenyeo' | 'harubang' | 'dolhareubang';

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

export interface POI {
  id: string;
  name: string;
  category: '자연과 지리' | '생활과 민속' | '문화유산' | '역사와 인물' | '문화와 예술' | string;
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
