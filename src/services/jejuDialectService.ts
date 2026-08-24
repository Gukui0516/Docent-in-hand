// 제주 방언 사전 OpenAPI(2,673건) 연동 & 청정 랜덤 닉네임 생성기
import { JEJU_DIALECT_DICTIONARY, DialectEntry } from '../data/jejuDialectData';

// 다정하고 따뜻한 수식어 (제주 방언 형용사 + 감성 형용사)
const POSITIVE_ADJECTIVES = [
  // 제주 방언 수식어
  '맨도롱한', // 따뜻하고 부드러운
  '베롱베롱한', // 반짝반짝 빛나는
  '소랑스러운', // 사랑스러운
  '곱닥한', // 곱고 아름다운
  '지꺼진', // 기쁘고 흥겨운
  '느랏한', // 느긋하고 여유로운
  '정다운', // 정이 넘치는
  
  // 한국어 감성 형용사
  '다정한',
  '신비로운',
  '따뜻한',
  '너그러운',
  '용감한',
  '정겨운',
  '포근한',
  '지혜로운',
  '해맑은',
  '즐거운',
  '신난',
  '단아한',
  '은은한',
  '기분좋은',
  '우아한',
  '상큼한',
  '푸근한',
  '빛나는',
  '소중한',
  '아름다운',
  '씩씩한',
  '슬기로운',
  '청량한',
  '산뜻한',
  '설레는',
  '당당한',
  '활기찬',
  '맑고고운'
];

// Fallback backup if needed
const DEFAULT_FALLBACK_NOUNS: DialectEntry[] = [
  { word: '바당', meaning: '바다', jeju: '바당', standard: '바다' },
  { word: '맨도롱', meaning: '따뜻함', jeju: '맨도롱', standard: '따뜻함' },
  { word: '베롱베롱', meaning: '반짝반짝', jeju: '베롱베롱', standard: '반짝반짝' },
  { word: '돌담', meaning: '현무암 돌담', jeju: '돌담', standard: '현무암 돌담' },
  { word: '동자석', meaning: '돌조각상', jeju: '동자석', standard: '돌조각상' },
  { word: '빙떡', meaning: '제주 전통 떡', jeju: '빙떡', standard: '제주 전통 떡' },
  { word: '돌하르방', meaning: '수호신', jeju: '돌하르방', standard: '수호신' },
  { word: '해녀', meaning: '잠녀', jeju: '해녀', standard: '잠녀' },
  { word: '오름', meaning: '화산체', jeju: '오름', standard: '화산체' },
  { word: '곶자왈', meaning: '원시림', jeju: '곶자왈', standard: '원시림' },
  { word: '동백', meaning: '동백꽃', jeju: '동백', standard: '동백꽃' },
  { word: '숨비소리', meaning: '해녀 숨소리', jeju: '숨비소리', standard: '해녀 숨소리' },
  { word: '백록', meaning: '흰 사슴', jeju: '백록', standard: '흰 사슴' },
  { word: '퐁낭', meaning: '팽나무', jeju: '퐁낭', standard: '팽나무' },
  { word: '솔오름', meaning: '소나무 오름', jeju: '솔오름', standard: '소나무 오름' }
];

const DIALECT_POOL: DialectEntry[] =
  JEJU_DIALECT_DICTIONARY && JEJU_DIALECT_DICTIONARY.length > 0
    ? JEJU_DIALECT_DICTIONARY
    : DEFAULT_FALLBACK_NOUNS;

/**
 * Generate a random clean nickname: [Positive Adjective] + [Jeju Dialect Noun]
 * Changes per POI or per generation call.
 */
export function getRandomJejuNickname(poiId?: string): string {
  let adjIndex = Math.floor(Math.random() * POSITIVE_ADJECTIVES.length);
  let nounIndex = Math.floor(Math.random() * DIALECT_POOL.length);

  // If poiId is provided, generate a seeded hash so it differs per POI
  if (poiId) {
    let hash = 0;
    for (let i = 0; i < poiId.length; i++) {
      hash = (hash << 5) - hash + poiId.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    adjIndex = seed % POSITIVE_ADJECTIVES.length;
    nounIndex = (seed + 13) % DIALECT_POOL.length;
  }

  const adjective = POSITIVE_ADJECTIVES[adjIndex];
  const item = DIALECT_POOL[nounIndex];

  return `${adjective} ${item.word}`;
}

/**
 * Look up dialect word meaning
 */
export function getJejuDialectMeaning(word: string): string | undefined {
  const found = DIALECT_POOL.find((d) => d.word === word);
  return found?.meaning;
}

/**
 * Get total number of loaded dialects
 */
export function getTotalDialectCount(): number {
  return DIALECT_POOL.length;
}
