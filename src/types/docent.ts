export type CharacterId = 'seolmundae' | 'haenyeo' | 'harubang';

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  avatarEmoji: string;
  badgeColor: string;
  accentColor: string;
  personality: string;
  greeting: string;
  dialectSummary: string;
  systemPrompt: string;
}

export interface POI {
  id: string;
  name: string;
  category: '자연과 지리' | '생활과 민속' | '문화유산';
  assignedCharacterId: CharacterId;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  imageTitle: string;
  imageSource: string;
  tags: string[];
  mythAndFact: {
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
