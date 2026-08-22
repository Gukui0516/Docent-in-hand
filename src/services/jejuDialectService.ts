// 제주 방언 사전 API 서비스 & Clean Random Nickname Generator

const POSITIVE_ADJECTIVES = [
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
  '당당한'
];

// Clean & Authentic Jeju Dialect Nouns (제주 방언 명사)
const DEFAULT_JEJU_NOUNS = [
  '바당', // 바다
  '낭', // 나무
  '맨도롱', // 따뜻함
  '베롱베롱', // 반짝반짝
  '돌담', // 돌담
  '동자석', // 동자석
  '빙떡', // 제주 전통 떡
  '도다니', // 나들이
  '혼저', // 어서
  '우도', // 우도
  '돌하르방', // 돌하르방
  '해녀', // 해녀
  '오름', // 오름
  '곶자왈', // 숲
  '동백', // 동백꽃
  '숨비소리', // 해녀 숨소리
  '산록', // 산자락
  '한라산', // 한라산
  '돗거미', // 금빛 거미
  '퐁낭', // 팽나무
  '퐁당', // 물방울
  '솔오름', // 소나무 오름
  '백록', // 흰 사슴
  '우틔' // 하늘
];

// Negative / Foul word filter to guarantee clean nicknames
const NEGATIVE_KEYWORDS = [
  '죽', '병', '피', '귀신', '악마', '슬픔', '아픔', '눈물', '도둑', '도망',
  '칼', '시체', '해', '악', '망', '똥', '오줌', '괴물', '썩', '독', '미움',
  '싸움', '전쟁', '욕', '망할', '어둔', '어둠', '거짓', '가난', '독사'
];

let fetchedJejuNouns: string[] = [];

/**
 * Fetch Jeju Dialect Dictionary from Open API
 * Endpoint: https://www.jeju.go.kr/rest/JejuDialectService/getJejuDialectServiceList
 */
export async function fetchJejuDialectFromAPI(): Promise<string[]> {
  try {
    const response = await fetch(
      'https://www.jeju.go.kr/rest/JejuDialectService/getJejuDialectServiceList?page=1&pageSize=30'
    );
    if (!response.ok) return DEFAULT_JEJU_NOUNS;

    const text = await response.text();
    // Parse XML siteName tags (<siteName>...</siteName>)
    const matches = Array.from(text.matchAll(/<siteName>(.*?)<\/siteName>/g));

    const apiNouns = matches
      .map((m) => m[1]?.trim())
      .filter((name): name is string => {
        if (!name || name.length < 2 || name.length > 8) return false;
        // Exclude any negative words
        return !NEGATIVE_KEYWORDS.some((kw) => name.includes(kw));
      });

    if (apiNouns.length > 0) {
      fetchedJejuNouns = Array.from(new Set([...DEFAULT_JEJU_NOUNS, ...apiNouns]));
    }
  } catch (error) {
    console.warn('[JejuDialectAPI] Using fallback dictionary due to CORS or Network limit:', error);
  }

  return fetchedJejuNouns.length > 0 ? fetchedJejuNouns : DEFAULT_JEJU_NOUNS;
}

/**
 * Generate a random clean nickname: [Positive Adjective] + [Jeju Dialect Noun]
 * Changes per POI or per generation call.
 */
export function getRandomJejuNickname(poiId?: string): string {
  const nounPool = fetchedJejuNouns.length > 0 ? fetchedJejuNouns : DEFAULT_JEJU_NOUNS;

  let adjIndex = Math.floor(Math.random() * POSITIVE_ADJECTIVES.length);
  let nounIndex = Math.floor(Math.random() * nounPool.length);

  // If poiId is provided, generate a fresh seeded hash so it differs per POI
  if (poiId) {
    let hash = 0;
    for (let i = 0; i < poiId.length; i++) {
      hash = (hash << 5) - hash + poiId.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    adjIndex = seed % POSITIVE_ADJECTIVES.length;
    nounIndex = (seed + 7) % nounPool.length;
  }

  const adjective = POSITIVE_ADJECTIVES[adjIndex];
  const jejuNoun = nounPool[nounIndex];

  return `${adjective} ${jejuNoun}`;
}

// Prefetch API on load
fetchJejuDialectFromAPI();
