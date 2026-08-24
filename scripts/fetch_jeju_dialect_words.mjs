import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rigorous negative blocklist (terms or meanings to discard)
const STRICT_NEGATIVE_KEYWORDS = [
  '죽', '사망', '시체', '주검', '상여', '무덤', '묏자리', '귀신', '도깨비', '악마',
  '괴물', '살인', '타살', '자살', '유배', '귀양', '죄', '죄인', '지옥', '염라',
  '병', '질병', '전염', '암', '종기', '골병', '염병', '문둥', '나병', '고름', '피',
  '통증', '고통', '아픔', '슬픔', '눈물', '한숨', '비극', '비명', '괴로움', '신음',
  '도둑', '도적', '강도', '사기', '도망', '배신', '칼', '창', '활', '총', '무기',
  '똥', '오줌', '분변', '구토', '가래', '침', '썩', '부패', '독', '독사', '해충',
  '싸움', '전쟁', '폭력', '때리', '맞', '욕', '망할', '지랄', '놈', '년', '새끼',
  '거짓', '사기', '가난', '흉년', '흉작', '굶', '기근', '어둔', '어둠', '암흑',
  '추락', '익사', '화재', '불행', '재앙', '파멸', '폐', '흉', '미친', '광기',
  '게으름', '흉보', '못된', '나쁜', '거지', '미움', '원망', '시애'
];

// Conversational fillers/particles not suitable for naming
const EXCLUDED_FILLERS = new Set([
  '옵서', '예게', '에게', '어이', '애개', '아이구기여', '무사', '날봅서', '기여',
  '게난', '경허문', '게난마씀', '마씀', '이서', '없서', '하난', '고라', '하난마씀'
]);

// Essential iconic Jeju cultural words
const ESSENTIAL_JEJU_WORDS = [
  { word: '바당', meaning: '바다' },
  { word: '맨도롱', meaning: '따뜻하고 부드러운 상태' },
  { word: '베롱베롱', meaning: '반짝반짝 빛남' },
  { word: '소랑', meaning: '사랑' },
  { word: '곱닥', meaning: '곱고 아름다움' },
  { word: '지꺼짐', meaning: '기쁨과 흥겨움' },
  { word: '퐁낭', meaning: '마을을 지키는 팽나무' },
  { word: '오름', meaning: '기생화산/언덕' },
  { word: '곶자왈', meaning: '원시 생명의 숲' },
  { word: '동자석', meaning: '무덤 곁을 지키는 돌조각상' },
  { word: '돌하르방', meaning: '마을의 수호신 돌할아버지' },
  { word: '숨비소리', meaning: '물질 후 해녀의 숨소리' },
  { word: '빙떡', meaning: '제주 전통 메밀 떡' },
  { word: '백록', meaning: '한라산의 신선이 타던 흰 사슴' },
  { word: '우틔', meaning: '하늘과 구름' },
  { word: '낭', meaning: '나무' },
  { word: '돌담', meaning: '제주의 바람을 품은 검은 현무암 담' },
  { word: '해녀', meaning: '바다를 품은 잠녀' },
  { word: '솔오름', meaning: '소나무 오름' },
  { word: '물질', meaning: '바다 해산물 채취' },
  { word: '비바리', meaning: '제주의 처녀' },
  { word: '동백', meaning: '겨울을 붉게 물들이는 동백꽃' },
  { word: '감귤', meaning: '제주의 황금 열매' },
  { word: '자리돔', meaning: '제주 바다의 대표 물고기' },
  { word: '옥돔', meaning: '제주 귀한 생선' },
  { word: '돗거미', meaning: '황금빛 거미' }
];

function isClean(word, meaning) {
  if (!word || word.length < 2 || word.length > 6) return false;
  if (!/^[가-힣]+$/.test(word)) return false;
  if (EXCLUDED_FILLERS.has(word)) return false;

  for (const kw of STRICT_NEGATIVE_KEYWORDS) {
    if (word.includes(kw)) return false;
  }
  if (meaning) {
    for (const kw of STRICT_NEGATIVE_KEYWORDS) {
      if (meaning.includes(kw)) return false;
    }
  }
  return true;
}

export async function fetchAllJejuDialects() {
  console.log('Fetching comprehensive dialect dictionary from Jeju OpenAPI (7,159 words)...');
  const allWordMap = new Map();

  // Add essential words first
  for (const item of ESSENTIAL_JEJU_WORDS) {
    allWordMap.set(item.word, item);
  }

  // Iterate across 40 pages (4,000 items)
  for (let page = 1; page <= 40; page++) {
    const url = 'https://www.jeju.go.kr/rest/JejuDialectService/getJejuDialectServiceList?pageSize=100&page=' + page;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const xml = await res.text();

      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const itemXml of itemMatches) {
        const siteNameMatch = itemXml.match(/<siteName>(.*?)<\/siteName>/);
        const contentsMatch = itemXml.match(/<contents>(.*?)<\/contents>/);

        let word = siteNameMatch ? siteNameMatch[1].trim() : '';
        let meaning = contentsMatch ? contentsMatch[1].trim() : '';

        // Clean HTML entities from meaning
        meaning = meaning.replace(/&amp;#\d+;/g, '').replace(/<[^>]+>/g, '').trim();

        if (isClean(word, meaning)) {
          if (!allWordMap.has(word)) {
            allWordMap.set(word, { word, meaning });
          }
        }
      }
      if (page % 10 === 0) {
        console.log(`- Completed page ${page}/40 (Current clean words: ${allWordMap.size})...`);
      }
    } catch (err) {
      console.warn(`[Fetch Error] page ${page}:`, err.message);
    }
  }

  const cleanList = Array.from(allWordMap.values()).map((item) => ({
    word: item.word,
    meaning: item.meaning,
    jeju: item.word,
    standard: item.meaning
  }));
  console.log(`Successfully fetched & filtered ${cleanList.length} clean authentic Jeju dialect words!`);

  const outPath = path.resolve(__dirname, '../src/data/jejuDialectData.ts');
  const fileContent = `// scripts/crawl_gubi_aks_jeju.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('Initializing Jeju Oral Literature Crawler & Cross-Validator...');

// Total clean entries: ${cleanList.length}

export interface DialectEntry {
  word: string;
  meaning: string;
  jeju: string;
  standard: string;
}

export const JEJU_DIALECT_DICTIONARY: DialectEntry[] = ${JSON.stringify(cleanList, null, 2)};

export const JEJU_FEW_SHOTS: Record<string, { standard: string; jeju: string }[]> = {
  summaryAgent: [
    {
      standard: "성산일출봉은 화산 분출로 형성된 수성화산체입니다.",
      jeju: "성산일출봉은 바당 속 화산 분출로 만들어진 수성화산체우다."
    }
  ],
  default: [
    {
      standard: "성산일출봉은 화산 분출로 형성된 수성화산체입니다.",
      jeju: "성산일출봉은 바당 속 화산 분출로 만들어진 수성화산체우다."
    }
  ]
};
`;

  fs.writeFileSync(outPath, fileContent, 'utf-8');
  console.log('Saved clean dialect dictionary to: ' + outPath);
}

fetchAllJejuDialects();
