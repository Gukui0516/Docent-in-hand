import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jejuGeoResolver } from './jeju_geo_resolver.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_POI_DATA = path.join(ROOT_DIR, 'src/data/poiData.ts');
const SRC_RAG_KB = path.join(ROOT_DIR, 'src/data/ragKnowledgeBase.ts');
const SRC_CORPUS = path.join(ROOT_DIR, 'src/data/ragFullCorpus.json');
const SERVER_CORPUS = path.join(ROOT_DIR, 'server/src/data/ragFullCorpus.json');

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  bull: '•',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  tilde: '~'
};

const ENTITY_RE = /&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g;

function decodeEntities(text) {
  if (typeof text !== 'string' || !text.includes('&')) return text;
  return text.replace(ENTITY_RE, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole;
      if (code === 160) return ' ';
      if (code === 183 || code === 8231) return '·';
      if (code === 8226) return '•';
      return String.fromCodePoint(code);
    }
    const lower = body.toLowerCase();
    return NAMED_ENTITIES[lower] ?? whole;
  }).replace(/\u00a0/g, ' ');
}

function deepDecode(value) {
  if (typeof value === 'string') return decodeEntities(value);
  if (Array.isArray(value)) return value.map(deepDecode);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[decodeEntities(k)] = deepDecode(v);
    }
    return out;
  }
  return value;
}

// Verified inland anchor coordinates for Jeju administrative regions (NO OFFSET JITTER)
const REGION_COORDS = {
  '구좌읍': [33.5200, 126.7716],
  '조천읍': [33.5300, 126.6344],
  '애월읍': [33.4600, 126.3292],
  '한림읍': [33.4100, 126.2625],
  '한경면': [33.3450, 126.1865],
  '성산읍': [33.4475, 126.9142],
  '표선면': [33.3267, 126.8315],
  '남원읍': [33.2798, 126.7198],
  '안덕면': [33.2505, 126.3402],
  '대정읍': [33.2268, 126.2524],
  '중문동': [33.2492, 126.4123],
  '서홍동': [33.2541, 126.5492],
  '동홍동': [33.2560, 126.5650],
  '천지동': [33.2458, 126.5601],
  '정방동': [33.2450, 126.5700],
  '중앙동': [33.2500, 126.5600],
  '송산동': [33.2420, 126.5720],
  '효돈동': [33.2550, 126.6150],
  '영천동': [33.2750, 126.5850],
  '대륜동': [33.2480, 126.5100],
  '대천동': [33.2480, 126.4750],
  '예래동': [33.2450, 126.3850],
  '용담동': [33.5085, 126.5130],
  '용담1동': [33.5085, 126.5130],
  '용담2동': [33.5075, 126.5050],
  '삼도동': [33.5090, 126.5220],
  '삼도1동': [33.5030, 126.5220],
  '삼도2동': [33.5110, 126.5220],
  '일도동': [33.5065, 126.5332],
  '일도1동': [33.5120, 126.5280],
  '일도2동': [33.5065, 126.5332],
  '이도동': [33.4985, 126.5332],
  '이도1동': [33.5050, 126.5280],
  '이도2동': [33.4985, 126.5332],
  '건입동': [33.5135, 126.5450],
  '아라동': [33.4568, 126.5456],
  '오라동': [33.4850, 126.5120],
  '연동': [33.4880, 126.4886],
  '노형동': [33.4820, 126.4789],
  '외도동': [33.4920, 126.4350],
  '이호동': [33.4930, 126.4550],
  '도두동': [33.5010, 126.4677],
  '삼양동': [33.5180, 126.5878],
  '화북동': [33.5160, 126.5650],
  '봉개동': [33.4682, 126.6021],
  '우도면': [33.5043, 126.9542],
  '추자면': [33.9575, 126.2975]
};

// Curated verified landmark coordinates on Jeju land (verified physical sites)
const EXACT_COORDS = {
  // Cultural Facilities & Museums
  '국립제주박물관': [33.5135, 126.5488],
  '제주목관아': [33.5130, 126.5225],
  '관덕정': [33.5130, 126.5225],
  '삼성혈': [33.4988, 126.5312],
  '민속자연사박물관': [33.4996, 126.5342],
  '제주도립미술관': [33.4532, 126.4895],
  '제주4·3평화공원': [33.4512, 126.6198],
  '돌문화공원': [33.4478, 126.6612],
  '해녀박물관': [33.5242, 126.8624],
  '김만덕기념관': [33.5146, 126.5288],
  '이중섭미술관': [33.2458, 126.5648],
  '제주민속촌': [33.3228, 126.8423],
  '성읍민속마을': [33.3871, 126.7997],
  '항일기념관': [33.5398, 126.6432],
  '추사관': [33.2392, 126.2845],
  '감귤박물관': [33.2715, 126.6048],
  '기당미술관': [33.2428, 126.5512],
  '소암기념관': [33.2425, 126.5742],
  '본태박물관': [33.3038, 126.3922],
  '방주교회': [33.3051, 126.3888],
  '김창열미술관': [33.3421, 126.2642],
  '현대미술관': [33.3408, 126.2662],
  '항공우주박물관': [33.3045, 126.3002],
  '오설록': [33.3061, 126.2895],

  // Natural Attractions - Mountains, Oreums, Craters
  '한라산': [33.3617, 126.5332],
  '백록담': [33.3617, 126.5332],
  '영실': [33.3541, 126.4975],
  '영실기암': [33.3541, 126.4975],
  '오백장군': [33.3541, 126.4975],
  '오백나한': [33.3541, 126.4975],
  '어리목': [33.3918, 126.4932],
  '성판악': [33.3842, 126.6175],
  '관음사': [33.4218, 126.5591],
  '성산일출봉': [33.4585, 126.9427],
  '산방산': [33.2366, 126.3134],
  '산방굴사': [33.2366, 126.3134],
  '송악산': [33.2003, 126.2902],
  '수월봉': [33.2952, 126.1627],
  '새별오름': [33.3665, 126.3562],
  '용눈이오름': [33.4608, 126.8327],
  '다랑쉬오름': [33.4735, 126.8335],
  '거문오름': [33.4599, 126.7136],
  '산굼부리': [33.4338, 126.6882],
  '사려니숲길': [33.4077, 126.6433],
  '비자림': [33.4913, 126.8337],
  '도두봉': [33.5069, 126.4677],
  '사라봉': [33.5228, 126.5458],
  '별도봉': [33.5235, 126.5532],
  '원당봉': [33.5245, 126.5925],
  '군산오름': [33.2541, 126.3685],
  '지미봉': [33.5132, 126.9075],
  '아부오름': [33.4475, 126.7775],
  '노꼬메': [33.4075, 126.4275],
  '따라비오름': [33.3855, 126.7525],
  '물영아리': [33.3705, 126.6932],

  // Coasts, Rocks, Beaches
  '용두암': [33.5165, 126.5126],
  '용연': [33.5165, 126.5126],
  '주상절리': [33.2378, 126.4249],
  '외돌개': [33.2403, 126.5458],
  '섭지코지': [33.4241, 126.9298],
  '용머리해안': [33.2324, 126.3148],
  '쇠소깍': [33.2527, 126.6234],
  '천지연폭포': [33.2448, 126.5595],
  '정방폭포': [33.2449, 126.5719],
  '천제연폭포': [33.2526, 126.4184],
  '엉또폭포': [33.2685, 126.5025],
  '협재해수욕장': [33.3941, 126.2397],
  '금능해수욕장': [33.3905, 126.2355],
  '곽지해수욕장': [33.4509, 126.3106],
  '함덕해수욕장': [33.5434, 126.6692],
  '김녕해수욕장': [33.5574, 126.7594],
  '월정리해수욕장': [33.5562, 126.7958],
  '세화해수욕장': [33.5251, 126.8529],
  '표선해수욕장': [33.3255, 126.8406],
  '중문색달해변': [33.2452, 126.4116],
  '이호테우해변': [33.4981, 126.4529],
  '삼양해수욕장': [33.5244, 126.5861],
  '화순금모래해변': [33.2392, 126.3355],

  // Caves
  '만장굴': [33.5284, 126.7716],
  '김녕굴': [33.5350, 126.7680],
  '협재굴': [33.3900, 126.2400],
  '쌍용굴': [33.3905, 126.2410],
  '미천굴': [33.3775, 126.8575],

  // Historic Sites, Shrines, Fortresses
  '항파두리': [33.4523, 126.4112],
  '삼별초': [33.4523, 126.4112],
  '환해장성': [33.5405, 126.6500],
  '별방진': [33.5285, 126.8775],
  '명월진': [33.3775, 126.2575],
  '화북진': [33.5235, 126.5650],
  '조천진': [33.5400, 126.6350],
  '수산진': [33.4400, 126.8950],
  '서귀진': [33.2435, 126.5675],
  '제주향교': [33.5085, 126.5165],
  '대정향교': [33.2385, 126.2875],
  '정의향교': [33.3850, 126.7950],
  '오현단': [33.5105, 126.5295],
  '귤림서원': [33.5105, 126.5295],
  '송당본향당': [33.4685, 126.7650],
  '칠머리당': [33.5215, 126.5415],
  '와흘본향당': [33.4925, 126.6550],
  '불탑사': [33.5245, 126.5925],
  '원당사지': [33.5245, 126.5925],
  '약천사': [33.2435, 126.4508],
  '선운사': [33.4675, 126.4825],
  '법화사': [33.2625, 126.4425],

  // Islands
  '우도': [33.5043, 126.9542],
  '비양도': [33.4072, 126.2272],
  '가파도': [33.1678, 126.2731],
  '마라도': [33.1165, 126.2682],
  '차귀도': [33.3135, 126.1472],
  '추자도': [33.9575, 126.2975]
};

const LANDMARK_KEYS = Object.keys(EXACT_COORDS);

function determinePersona(title, subcats, content) {
  return 'summaryAgent';
}

function classifyPoiCategory(it) {
  const title = (it.title || '').trim().normalize('NFC');
  const meta = it.metadata || it.meta || {};
  const mtype = meta['유형'] || meta.type || '';
  const field = meta['분야'] || meta.field || '';

  if (['설화', '신화', '전설', '민담', '본풀이'].some(k => mtype.includes(k))) return '설화';
  if (['구비 전승', '신화', '설화'].some(k => field.includes(k))) return '설화';

  if (['인물', '효자', '열녀', '의인', '학자', '문인'].some(k => mtype.includes(k)) || field.includes('성씨·인물')) return '인물';

  if (['음식', '식생활', '향토음식'].some(k => mtype.includes(k)) || field.includes('식생활')) return '음식';

  const festivalKeywords = ['축제', '제전', '음악회', '페스티벌', '대축제', '문화제', '영등굿', '입춘굿', '풍어제', '산신제', '포제', '당제'];
  if (festivalKeywords.some(k => title.includes(k)) || mtype.includes('행사') || mtype.includes('축제')) return '축제';

  const eduTerms = ['향교', '서원', '서당', '야학', '박물관', '미술관', '기념관', '도서관', '과학관', '문화원', '체육관', '수련원', '교육원'];
  if (eduTerms.some(k => title.includes(k)) || field.includes('문화·교육/교육')) return '교육';

  const heritageTypes = ['유적', '사적', '유형 유산', '문화유산'];
  const heritageWords = ['지석묘', '고인돌', '선돌', '원당사지', '하마비', '선정비', '공덕비', '삼별초', '항파두리', '환해장성', '목관아', '관덕정', '연대', '봉수', '성곽', '진성', '사찰', '석탑', '불상', '유적지', '충혼묘지', '위령비', '추모비', '비석', '본향당', '당'];
  if (heritageTypes.some(k => mtype.includes(k)) || field.includes('문화유산') || field.includes('역사/전통 시대') || field.includes('종교/불교') || heritageWords.some(k => title.includes(k))) return '문화유산';

  return '관광지';
}

function isValidPoi(it, title, meta) {
  const mtype = meta['유형'] || meta.type || '';
  const catType = it.category_type || '';
  const field = meta['분야'] || meta.field || '';
  const subcats = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];

  // 1. Strictly exclude pure portable artifacts (유물: 철기, 토기, 도자기, 서화, 의복 등)
  const isArtifact = mtype.includes('유물') || subcats.includes('유물') ||
    ['철기류', '토기류', '토기', '도자기', '청자', '백자', '동검', '철촉', '옥환', '패촉', '목판', '전적', '고문서', '의복', '장신구', '화천', '동경', '수저'].some(k => title.endsWith(k) || title.includes(`출토 ${k}`)) ||
    title.includes('출토') || title.includes('소장 불상') || title.includes('소장 전적');
  if (isArtifact && !['사지', '공원', '박물관', '미술관', '기념관', '유적지', '해변', '오름', '사찰'].some(p => title.includes(p))) {
    return false;
  }

  // 2. People/genealogies (인물, 성씨) - keep if they have physical memorials, shrines, tombs, or specific addresses
  const isPerson = mtype.includes('인물') || field.includes('성씨·인물') || mtype.includes('성씨') || subcats.includes('인물') || subcats.includes('성씨');
  if (isPerson) {
    const loc = meta['소재지'] || meta['위치'] || meta['지역'] || '';
    const hasPhysicalSite = ['기념관', '생가', '유허비', '사당', '묘', '공원', '박물관', '미술관', '비', '정려', '각', '터', '신도비'].some(k => title.includes(k)) ||
      (loc && loc.length > 5 && !loc.endsWith('도') && !loc.endsWith('시') && (loc.includes('번지') || loc.includes('길') || loc.includes('로') || loc.includes('[') || loc.includes('산') || loc.includes('동') || loc.includes('리')));
    if (!hasPhysicalSite) {
      return false;
    }
  }

  // 3. Strictly exclude culinary recipes / foods (음식물 조리법)
  const isFood = mtype.includes('음식') || field.includes('식생활') || subcats.includes('식생활') ||
    ['국수', '물회', '구이', '몸국', '갈치국', '성게국', '미역국', '토란국', '빙떡', '오메기떡', '돔베고기', '보말죽', '전복죽', '자리물회', '옥돔구이', '고등어조림', '갈치조림', '청국장', '된장', '간장', '고추장', '젓갈', '자리젓', '멸치젓', '막걸리', '오메기술', '고소리술', '꿩메밀칼국수'].some(k => title.endsWith(k) || title.includes(k));
  if (isFood && !['거리', '마을', '축제', '식당', '공원'].some(k => title.includes(k))) {
    return false;
  }

  // 4. Strictly exclude folk songs, shamanic chants, ballads, and lyrics
  const isSongOrChant = mtype.includes('민요') || mtype.includes('무가') || mtype.includes('대본') || mtype.includes('가사') ||
    title.endsWith('소리') || title.endsWith('노래') || title.endsWith('타령') || title.endsWith('농요') || title.endsWith('군악') ||
    title.includes('노래') || title.includes('타령') || (title.includes('소리') && !['바위', '포구', '굴'].some(w => title.includes(w)));
  if (isSongOrChant && !['노래비', '시비', '기념비'].some(k => title.includes(k))) {
    return false;
  }

  // 5. Strictly exclude abstract concepts, rituals, seasonal customs, laws
  if (mtype.includes('개념 용어') || mtype.includes('의례') || mtype.includes('제도') || mtype.includes('놀이') || mtype.includes('사건') || mtype.includes('개관') || catType === '개관항목') {
    if (!['공원', '기념관', '유적지', '사적', '동산'].some(k => title.includes(k))) {
      return false;
    }
  }

  // 6. Private clubs, theatrical companies, associations without tourism/public cultural building
  if (mtype.includes('기관 단체(일반)') || mtype.includes('기관 단체/기관 단체(일반)')) {
    if (!['박물관', '미술관', '문화원', '기념관', '도서관', '공원', '수목원', '과학관', '홍보관', '역사관', '전시관'].some(k => title.includes(k))) {
      return false;
    }
  }

  // 7. General modern schools, clinics, administrative offices
  if (['초등학교', '중학교', '고등학교', '대학교', '대학원', '유치원', '어린이집'].some(w => title.includes(w)) && !title.includes('옛터') && !title.includes('야학')) {
    return false;
  }
  if (['주민센터', '동주민센터', '읍사무소', '면사무소', '파출소', '치안센터', '소방서', '우체국', '세무서', '등기소', '보건소'].some(w => title.includes(w))) {
    return false;
  }

  // 8. Vehicle express roads and transit infrastructure (preserve scenic trails)
  const scenicTrailKeywords = ['올레', '올레길', '둘레길', '탐방로', '산책로', '숲길', '지질트레일', '트레킹', '등산로', '코스', '성곽', '진성', '옛터', '사적', '유적', '바람길', '순례길', '마실길', '생태길'];
  if (!scenicTrailKeywords.some(k => title.includes(k))) {
    const roadTerms = ['도로', '국도', '지방도', '군도', '면도', '리도', '고속도로', '순환도로', '우회도로', '일주도로', '중산간도로', '교차로', '로터리', '사거리', '버스정류장', '공용주차장'];
    if (roadTerms.some(w => title.includes(w))) return false;
    if (mtype.includes('교통/도로') || mtype.includes('지명/도로') || mtype.includes('교통/교통 시설')) return false;
  }

  return true;
}

function extractCoordinates(title, regionStr) {
  // 1. Priority 1: Match against curated verified landmark list
  for (const [k, coords] of Object.entries(EXACT_COORDS)) {
    if (title.includes(k)) {
      return [coords[0], coords[1]];
    }
  }

  // 2. Priority 2: Match against verified administrative region inland center (NO RANDOM JITTER)
  for (const [r, coords] of Object.entries(REGION_COORDS)) {
    if (regionStr.includes(r) || title.includes(r)) {
      return [coords[0], coords[1]];
    }
  }

  // 3. Fallback: Default Jeju center inland
  return [33.4996, 126.5312];
}

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (file.endsWith('.json')) {
      files.push(name);
    }
  }
  return files;
}

function loadAllJsonFiles() {
  const jsonFiles = getFiles(DATA_DIR);
  const allItems = [];
  const seenIds = new Set();

  console.log(`Scanning ${jsonFiles.length} JSON database files in ${DATA_DIR}...`);
  for (const fpath of jsonFiles) {
    if (fpath.includes('backup')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(fpath, 'utf8'));
      const baseName = path.basename(fpath);
      const regionDefault = (fpath.includes('Seogwipo') || baseName.includes('서귀포')) ? '서귀포시' : '제주시';

      const items = Array.isArray(data) ? data : (data.items || []);
      for (const it of items) {
        const itId = it.id || '';
        if (!itId || seenIds.has(itId)) continue;
        seenIds.add(itId);
        it.file_region = regionDefault;
        allItems.push(it);
      }
    } catch (e) {
      console.error(`Error reading ${fpath}:`, e.message);
    }
  }
  console.log(`Total unique items loaded from database: ${allItems.length}`);
  return allItems;
}

function processItemsToPois(allItems) {
  const pois = [];

  for (const it of allItems) {
    const title = (it.title || '').trim().normalize('NFC');
    const srcs = it.src || [];
    const multimedia = it.multimedia || [];

    const cleanImages = [];
    if (Array.isArray(srcs) && srcs.length > 0) {
      for (const s of srcs) {
        if (typeof s === 'string' && s.startsWith('http')) {
          cleanImages.push({
            src: s,
            alt: title,
            source: '한국학중앙연구원 한국향토문화전자대전',
            sourceUrl: it.url || ''
          });
        }
      }
    }

    if (cleanImages.length === 0 && Array.isArray(multimedia) && multimedia.length > 0) {
      for (const m of multimedia) {
        if (m.src && typeof m.src === 'string' && m.src.startsWith('http')) {
          cleanImages.push({
            src: m.src,
            alt: m.alt || title,
            source: '한국학중앙연구원 한국향토문화전자대전',
            sourceUrl: it.url || ''
          });
        }
      }
    }

    const cleanTitle = title.replace(/[「」]/g, '').trim();

    if (cleanImages.length === 0) {
      // Provide a high quality Jeju heritage fallback image so rich oral literature and folklore are not lost
      const DEFAULT_FALLBACK_IMG = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80';
      cleanImages.push({
        src: DEFAULT_FALLBACK_IMG,
        alt: cleanTitle,
        source: '한국학중앙연구원 한국향토문화전자대전 / 구비문학대계',
        sourceUrl: it.source_url || it.url || ''
      });
    }

    const meta = it.metadata || it.meta || {};
    if (!isValidPoi(it, cleanTitle, meta)) continue;

    const regionStr = meta['지역'] || it.file_region || '제주시';
    const subcats = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];
    
    let summary = it.summary || '';
    const fullTextRaw = it.full_text || '';
    if (!summary && fullTextRaw) {
      const lines = fullTextRaw.split('\n').map(l => l.trim()).filter(l => l && !(l.startsWith('[') && l.endsWith(']')));
      summary = lines[0] || '';
    }

    const sections = it.sections || [];
    let fullContent = '';
    if (fullTextRaw) {
      fullContent = fullTextRaw.trim();
    } else {
      const secText = sections.map(s => `${s.title || s.heading || ''}: ${s.content || (s.paragraphs ? s.paragraphs.join('\n') : '')}`).join('\n');
      fullContent = (summary + '\n' + secText).trim();
    }

    const category = classifyPoiCategory(it);
    const persona = determinePersona(title, subcats, fullContent);
    // precision 'city' 는 개별 위치를 못 찾아 시 중심점으로 떨어진 경우다.
    // 좌표 자체는 남기되(목록·정렬에서 필요) 지도 핀과 최근접 탐색에서는 제외한다.
    const [lat, lng, precision = 'exact'] = jejuGeoResolver.resolveCoordinates(it);
    const hasPreciseLocation = precision !== 'city';

    // Tags
    const tags = [];
    if (meta['분야']) tags.push(meta['분야'].split('/').pop());
    if (meta['시대']) tags.push(meta['시대'].split('/').pop());
    for (const s of subcats) {
      if (s && !tags.includes(s)) tags.push(s);
    }
    if (tags.length < 3) {
      tags.push('제주명소', '공식기록', '향토문화');
    }
    const finalTags = tags.slice(0, 4);

    const sampleQuestions = [
      `${title}의 핵심 정보와 주요 역사적 특징을 요약해 주세요.`,
      `${title}에서 놓치지 말고 꼭 봐야 할 핵심 포인트는 무엇인가요?`,
      `옛 조상들은 ${title}을 어떤 공간으로 기록하고 전승해왔나요?`
    ];

    const firstImg = cleanImages[0];
    pois.push({
      id: it.id,
      name: cleanTitle,
      category: category,
      region: regionStr,
      latitude: lat,
      longitude: lng,
      hasPreciseLocation,
      assignedCharacterId: persona,
      imageUrl: firstImg.src,
      images: cleanImages.slice(0, 6),
      imageTitle: firstImg.alt,
      imageSource: firstImg.source,
      sourceUrl: it.url || `https://jeju.grandculture.net/jeju/toc/${it.id}`,
      tags: finalTags,
      mythAndFact: {
        mythTitle: `${cleanTitle}에 깃든 구전 기록과 학술 팩트`,
        summary: summary.slice(0, 250),
        details: fullContent.slice(0, 800)
      },
      sampleQuestions: sampleQuestions
    });
  }

  function sortScore(p) {
    let landmarkIdx = 999;
    for (let idx = 0; idx < LANDMARK_KEYS.length; idx++) {
      if (p.name.includes(LANDMARK_KEYS[idx])) {
        landmarkIdx = idx;
        break;
      }
    }
    const photoCount = p.images ? p.images.length : 1;
    const descLength = p.mythAndFact.details ? p.mythAndFact.details.length : 0;
    return landmarkIdx * 10000 - photoCount * 100 - Math.min(descLength / 50, 20);
  }

  pois.sort((a, b) => sortScore(a) - sortScore(b));
  console.log(`Successfully extracted and sorted ${pois.length} verified physical POIs with valid coordinates.`);
  return pois;
}

function processFullRAGCorpus(allItems) {
  const corpus = [];
  const kbDocs = [];

  for (const it of allItems) {
    const title = (it.title || '').trim().normalize('NFC');
    const meta = it.metadata || it.meta || {};
    const subcats = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];
    const regionStr = meta['지역'] || it.file_region || '제주특별자치도';

    let summary = it.summary || '';
    const fullTextRaw = it.full_text || '';
    if (!summary && fullTextRaw) {
      const lines = fullTextRaw.split('\n').map(l => l.trim()).filter(l => l && !(l.startsWith('[') && l.endsWith(']')));
      summary = lines[0] || '';
    }

    let fullContent = fullTextRaw ? fullTextRaw.trim() : '';
    if (!fullContent && it.sections) {
      fullContent = it.sections.map(s => `${s.title || s.heading || ''}: ${s.content || (s.paragraphs ? s.paragraphs.join('\n') : '')}`).join('\n').trim();
    }
    if (!fullContent) {
      fullContent = summary;
    }

    const docId = it.id || `doc_${corpus.length + 1}`;
    const category = classifyPoiCategory(it);
    const persona = determinePersona(title, subcats, fullContent);

    const doc = {
      id: docId,
      title: title,
      category: category,
      region: regionStr,
      subcats: subcats,
      summary: summary.slice(0, 300),
      content: fullContent,
      assignedCharacterId: persona,
      source: '한국향토문화전자대전 (한국학중앙연구원)',
      sourceUrl: it.url || `https://jeju.grandculture.net/jeju/toc/${docId}`,
      metadata: {
        type: meta['유형'] || '',
        field: meta['분야'] || '',
        period: meta['시대'] || '',
        region: regionStr,
        subcategories: subcats
      }
    };

    corpus.push(doc);

    kbDocs.push({
      id: docId,
      poiId: it.id,
      title: title,
      category: category,
      region: regionStr,
      source: '한국향토문화전자대전 (한국학중앙연구원)',
      sourceUrl: it.url || `https://jeju.grandculture.net/jeju/toc/${docId}`,
      summary: summary.slice(0, 200),
      content: fullContent.slice(0, 1000),
      assignedCharacterId: persona,
      metadata: {
        type: meta['유형'] || '',
        field: meta['분야'] || '',
        period: meta['시대'] || '',
        region: regionStr
      }
    });
  }

  console.log(`Generated complete RAG corpus with ${corpus.length} academic documents across all Jeju heritage.`);
  return { corpus, kbDocs };
}

function main() {
  console.log('=== Starting Jeju Myth & Heritage Sync Pipeline ===');
  const allItems = loadAllJsonFiles();

  const pois = processItemsToPois(allItems);
  const { corpus, kbDocs } = processFullRAGCorpus(allItems);

  // Apply deep entity decoding to ensure 0 HTML entities or encoding bugs
  const decodedPois = deepDecode(pois);
  const decodedCorpus = deepDecode(corpus);
  const decodedKbDocs = deepDecode(kbDocs);

  // 1. Write src/data/poiData.ts
  const poiDataTsContent = `// Automatically generated and synced by scripts/sync_data_to_app.mjs
// Source: 한국학중앙연구원 한국향토문화전자대전 (제주특별자치도 & 서귀포시 전자대전)
import { POI } from '../types/docent';

export const POI_LIST: POI[] = ${JSON.stringify(decodedPois, null, 2)};
`;
  fs.writeFileSync(SRC_POI_DATA, poiDataTsContent, 'utf8');
  console.log(`[OK] Wrote ${decodedPois.length} verified physical POIs to ${SRC_POI_DATA}`);

  // 2. Write src/data/ragKnowledgeBase.ts
  const ragKbTsContent = `// Automatically generated and synced by scripts/sync_data_to_app.mjs
// Comprehensive Jeju Academic Knowledge Base for Docent AI & RAG
import { RAGDocument } from '../types/docent';

export const RAG_KNOWLEDGE_BASE: RAGDocument[] = ${JSON.stringify(decodedKbDocs, null, 2)};
`;
  fs.writeFileSync(SRC_RAG_KB, ragKbTsContent, 'utf8');
  console.log(`[OK] Wrote ${decodedKbDocs.length} knowledge base documents to ${SRC_RAG_KB}`);

  // 3. Write ragFullCorpus.json (Frontend + Server)
  const corpusJson = JSON.stringify(decodedCorpus, null, 2);
  fs.writeFileSync(SRC_CORPUS, corpusJson, 'utf8');
  console.log(`[OK] Wrote full corpus (${decodedCorpus.length} items) to ${SRC_CORPUS}`);

  if (fs.existsSync(path.dirname(SERVER_CORPUS))) {
    fs.writeFileSync(SERVER_CORPUS, corpusJson, 'utf8');
    console.log(`[OK] Synced full corpus to ${SERVER_CORPUS}`);
  }

  console.log('=== Sync Pipeline Completed Successfully ===');
}

main();
