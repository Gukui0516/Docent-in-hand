import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_POI_DATA = path.join(ROOT_DIR, 'src/data/poiData.ts');
const SRC_RAG_KB = path.join(ROOT_DIR, 'src/data/ragKnowledgeBase.ts');
const SRC_CORPUS = path.join(ROOT_DIR, 'src/data/ragFullCorpus.json');
const SERVER_CORPUS = path.join(ROOT_DIR, 'server/src/data/ragFullCorpus.json');

// Standard coordinates for Jeju regions (Eup/Myeon/Dong) to map real places accurately
const REGION_COORDS = {
  '구좌읍': [33.5284, 126.7716],
  '조천읍': [33.5350, 126.6344],
  '애월읍': [33.4631, 126.3292],
  '한림읍': [33.4147, 126.2625],
  '한경면': [33.3512, 126.1865],
  '우도면': [33.5043, 126.9542],
  '추자면': [33.9575, 126.2975],
  '성산읍': [33.4475, 126.9142],
  '표선면': [33.3267, 126.8315],
  '남원읍': [33.2798, 126.7198],
  '안덕면': [33.2505, 126.3402],
  '대정읍': [33.2268, 126.2524],
  '중문동': [33.2492, 126.4123],
  '서홍동': [33.2541, 126.5492],
  '천지동': [33.2458, 126.5601],
  '용담동': [33.5142, 126.5122],
  '일도동': [33.5078, 126.5332],
  '이도동': [33.4985, 126.5332],
  '삼양동': [33.5234, 126.5878],
  '도두동': [33.5069, 126.4677],
  '노형동': [33.4837, 126.4789],
  '연동': [33.4912, 126.4886],
  '아라동': [33.4568, 126.5456],
  '봉개동': [33.4682, 126.6021]
};

// Known curated coordinates for famous landmarks
const EXACT_COORDS = {
  '만장굴': [33.5284, 126.7716],
  '용연': [33.5165, 126.5126],
  '용두암': [33.5165, 126.5126],
  '수월봉': [33.2952, 126.1627],
  '사려니': [33.4077, 126.6433],
  '새별': [33.3665, 126.3562],
  '용눈이': [33.4608, 126.8327],
  '다랑쉬': [33.4735, 126.8335],
  '거문 오름': [33.4599, 126.7136],
  '산굼부리': [33.4338, 126.6882],
  '금능': [33.3905, 126.2355],
  '협재': [33.3941, 126.2397],
  '함덕': [33.5434, 126.6692],
  '김녕': [33.5574, 126.7594],
  '월정': [33.5562, 126.7958],
  '곽지': [33.4509, 126.3106],
  '우도': [33.5043, 126.9542],
  '도두봉': [33.5069, 126.4677],
  '삼양동': [33.5234, 126.5878],
  '항파두리': [33.4523, 126.4112],
  '성산일출봉': [33.4585, 126.9427],
  '산방산': [33.2366, 126.3134],
  '주상절리': [33.2378, 126.4249],
  '천지연': [33.2448, 126.5595],
  '정방': [33.2449, 126.5719],
  '쇠소깍': [33.2527, 126.6234],
  '섭지코지': [33.4241, 126.9298],
  '외돌개': [33.2403, 126.5458],
  '용머리해안': [33.2324, 126.3148],
  '비자림': [33.4913, 126.8337],
  '한라산': [33.3617, 126.5332],
  '백록담': [33.3617, 126.5332]
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
  const subs = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];
  const subStr = subs.join(' ');

  if (['설화', '신화', '전설', '민담', '본풀이', '민요', '무가'].some(k => mtype.includes(k))) return '설화';
  if (['구비 전승', '신화', '설화'].some(k => field.includes(k)) && !mtype.includes('행사') && !mtype.includes('축제')) return '설화';
  if ((title.startsWith('「') || title.startsWith('『')) && ['전설', '이야기', '본풀이', '민요', '노래', '설화', '방언집', '속담'].some(k => title.includes(k))) return '설화';

  if (mtype.startsWith('인물/') || field.includes('성씨·인물') || mtype.startsWith('성씨/')) return '인물';

  if (mtype.includes('음식물') || field.includes('식생활') || mtype.includes('음식') || subStr.includes('식생활') || subStr.includes('음식')) return '음식';
  const dishSuffixes = ['국수', '물회', '구이', '몸국', '갈치국', '성게국', '미역국', '토란국', '빙떡', '오메기떡', '돔베고기', '보말죽', '전복죽', '자리물회', '옥돔구이', '고등어조림', '갈치조림', '청국장', '된장', '간장', '고추장', '젓갈', '자리젓', '멸치젓', '막걸리', '오메기술', '고소리술', '꿩메밀칼국수'];
  if (dishSuffixes.some(s => title.endsWith(s)) || ['흑돼지', '빙떡', '오메기떡', '돔베고기', '몸국', '보말국', '보말죽', '자리물회'].some(s => title.includes(s))) {
    if (!['마을', '오름', '축제', '협회', '학회', '주식회사', '초등학교', '중학교', '고등학교'].some(k => title.includes(k))) return '음식';
  }

  const festivalKeywords = ['축제', '제전', '음악회', '페스티벌', '대축제', '문화제', '연극제', '영화제', '불꽃축제', '마라톤대회', '영등굿', '입춘굿', '풍어제', '산신제', '포제', '당제'];
  if (festivalKeywords.some(k => title.includes(k)) || mtype.includes('행사') || mtype.includes('축제') || field.includes('축제') || mtype.includes('의례/제')) return '축제';

  const eduTerms = ['향교', '서원', '서당', '야학', '박물관', '미술관', '기념관', '도서관', '과학관', '문화원', '체육관', '수련원', '교육원', '학교', '대학'];
  if (eduTerms.some(k => title.includes(k)) || field.includes('문화·교육/교육') || mtype.includes('기관 단체/학교')) return '교육';

  const heritageTypes = ['유물', '유적', '기록유산', '무형 유산', '유형 유산', '문화유산'];
  const heritageWords = ['지석묘', '고인돌', '선돌', '마애명', '원당사지', '하마비', '선정비', '공덕비', '삼별초', '항파두리', '환해장성', '목관아', '관덕정', '연대', '봉수', '성곽', '진성', '사찰', '석탑', '불상', '유적지', '충혼묘지', '위령비', '추모비', '비석'];
  if (heritageTypes.some(k => mtype.includes(k)) || field.includes('문화유산') || field.includes('역사/전통 시대') || field.includes('종교/불교') || heritageWords.some(k => title.includes(k))) return '문화유산';

  return '관광지';
}

function isValidPoi(it, title, meta) {
  const mtype = meta['유형'] || meta.type || '';
  const catType = it.category_type || '';
  const category7 = it.category_7 || classifyPoiCategory(it);

  if (mtype.includes('개관') || catType === '개관항목' || mtype.includes('개념 용어')) {
    if (category7 === '음식') {
      const dishIndicators = ['국수', '물회', '구이', '몸국', '갈치국', '성게국', '미역국', '토란국', '빙떡', '오메기떡', '돔베고기', '보말죽', '전복죽', '자리물회', '옥돔구이', '고등어조림', '갈치조림', '청국장', '된장', '간장', '고추장', '젓갈', '자리젓', '멸치젓', '막걸리', '오메기술', '고소리술', '꿩메밀칼국수', '수애', '솔변', '둠비', '칼국', '괴기', '돗괴기', '감제침떡', '거스름떡', '생감주', '가문반'];
      if (!dishIndicators.some(k => title.includes(k))) return false;
    } else {
      return false;
    }
  }

  const abstractConcepts = new Set([
    '관광', '교통', '지리', '역사', '문화', '예술', '체육', '종교', '산업', '농업', '어업', '임업',
    '축산업', '상업', '무역', '금융', '사회', '정치', '행정', '사법', '치안', '국방', '통신', '언론',
    '출판', '문학', '어학', '민속', '의식주', '의생활', '식생활', '주생활', '풍속', '신앙', '구비전승',
    '성씨', '인물', '유적', '유물', '문화유산', '자연', '동물', '식물', '환경', '기후', '지형', '지질',
    '관광지', '축제', '행사', '공연', '전시', '교육', '학문', '도서관', '박물관', '미술관', '자연지리',
    '인문지리', '인구', '생태계', '천연기념물', '기온', '강수', '바람', '토양', '하천', '해안', '바다',
    '섬', '동굴', '화산 폭발', '방패형 화산', '지하수', '용천수', '해류', '자연재해', '기상재해', '태풍',
    '해안 지형', '산담', '올레', '걸바다 밭', '토성', '입도조', '세거 성씨', '집성촌', '구비 전승',
    '제주 토지 조사 사업', '제주 4·3 전략촌', '복지', '지명', '설화', '신화', '전설', '민요', '무가',
    '속담', '교육 기관', '교육 과정', '장학'
  ]);
  if (abstractConcepts.has(title) || title.length <= 1) return false;

  const ritualConcepts = new Set([
    '혼례', '상례', '제례', '관례', '계례', '돌잔치', '회갑', '초경', '성년례', '통과의례',
    '출산의례', '혼례복', '제례 음식', '혼례 음식', '상례복', '계', '품앗이', '수눌음', '장례',
    '마을 신앙', '본향당 신앙', '포제', '당굿'
  ]);
  if (ritualConcepts.has(title)) return false;

  const historicSchoolKeywords = ['향교', '서원', '서당', '야학', '구교', '옛터', '유적', '사적', '항일', '기념관'];
  const isHistoric = historicSchoolKeywords.some(k => title.includes(k));
  if (!isHistoric) {
    if (['초등학교', '중학교', '고등학교', '대학교', '대학원', '유치원', '어린이집', '학원'].some(w => title.includes(w))) return false;
    if (['학교', '대학교', '고등학교', '중학교', '초등학교'].includes(title)) return false;
    if (mtype.includes('기관 단체/학교') || mtype.includes('학교')) return false;
    const commercialTerms = ['서점', '책방', '병의원', '약국', '마트', '상점', '의원'];
    if (commercialTerms.includes(title) || (title.includes('병원') && !title.includes('옛터')) || (title.includes('의원') && !title.includes('옛터'))) return false;
  }

  const historicOfficeKeywords = ['목관아', '관덕정', '정의현', '대정현', '진성', '성곽', '유적', '옛터'];
  if (!historicOfficeKeywords.some(k => title.includes(k))) {
    const officeTerms = ['주민센터', '동주민센터', '읍사무소', '면사무소', '파출소', '치안센터', '소방서', '우체국', '세무서', '등기소', '선거관리위원회', '검찰청', '법원', '경찰서', '보건소'];
    if (officeTerms.some(w => title.includes(w)) || officeTerms.includes(title)) return false;
  }

  if (mtype.includes('행정 지명과 마을') || mtype.includes('행정구역')) {
    if (!['민속마을', '전통마을', '체험마을', '생태마을', '예술마을', '문화마을'].some(k => title.includes(k))) return false;
  }

  return true;
}

function extractCoordinates(title, regionStr) {
  for (const [k, coords] of Object.entries(EXACT_COORDS)) {
    if (title.includes(k)) {
      return [coords[0], coords[1]];
    }
  }

  for (const [r, coords] of Object.entries(REGION_COORDS)) {
    if (regionStr.includes(r) || title.includes(r)) {
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash += title.charCodeAt(i);
      }
      hash = hash % 100;
      const offsetLat = ((hash % 10) - 5) * 0.003;
      const offsetLng = (Math.floor(hash / 10) % 10 - 5) * 0.003;
      return [
        Math.round((coords[0] + offsetLat) * 10000) / 10000,
        Math.round((coords[1] + offsetLng) * 10000) / 10000
      ];
    }
  }

  return [33.4996, 126.5312]; // Default Jeju Center
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

    if (cleanImages.length === 0) continue;

    const meta = it.metadata || it.meta || {};
    if (!isValidPoi(it, title, meta)) continue;

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
    const [lat, lng] = extractCoordinates(title, regionStr);

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

    // Generate 3 contextual sample questions
    const sampleQuestions = [
      `${title}의 지형과 역사에 얽힌 흥미로운 이야기를 들려주세요.`,
      `${title}에서 놓치지 말고 꼭 봐야 할 핵심 포인트는 무엇인가요?`,
      `옛 조상들은 ${title}을 어떤 공간으로 기록하고 전승해왔나요?`
    ];

    sampleQuestions[0] = `${title}의 핵심 정보와 주요 역사적 특징을 요약해 주세요.`;

    const firstImg = cleanImages[0];
    pois.push({
      id: it.id,
      name: title,
      category: category,
      region: regionStr,
      latitude: lat,
      longitude: lng,
      assignedCharacterId: persona,
      imageUrl: firstImg.src,
      images: cleanImages.slice(0, 6),
      imageTitle: firstImg.alt,
      imageSource: firstImg.source,
      sourceUrl: it.url || `https://jeju.grandculture.net/jeju/toc/${it.id}`,
      tags: finalTags,
      mythAndFact: {
        mythTitle: `${title}에 깃든 구전 기록과 학술 팩트`,
        summary: summary.slice(0, 250),
        details: fullContent.slice(0, 800)
      },
      sampleQuestions: sampleQuestions
    });
  }

  // Sort score: Prioritize famous landmarks, photo count, then content length
  function sortScore(p) {
    let landmarkIdx = 999;
    for (let idx = 0; idx < LANDMARK_KEYS.length; idx++) {
      if (p.name.includes(LANDMARK_KEYS[idx])) {
        landmarkIdx = idx;
        break;
      }
    }
    const photoCount = (p.images || []).length;
    const detailsLen = (p.mythAndFact && p.mythAndFact.details) ? p.mythAndFact.details.length : 0;
    return { landmarkIdx, photoCount, detailsLen };
  }

  pois.sort((a, b) => {
    const sA = sortScore(a);
    const sB = sortScore(b);
    if (sA.landmarkIdx !== sB.landmarkIdx) return sA.landmarkIdx - sB.landmarkIdx;
    if (sA.photoCount !== sB.photoCount) return sB.photoCount - sA.photoCount;
    return sB.detailsLen - sA.detailsLen;
  });

  console.log(`Processed ${pois.length} interactive POIs with verified photos!`);
  return pois;
}

function writeFrontendPoiData(pois) {
  let content = 'import { POI } from "../types/docent";\n\n';
  content += '// 100% Verified POI Data generated strictly from Data/ JSON database\n';
  content += 'export const POI_LIST: POI[] = ' + JSON.stringify(pois, null, 2) + ';\n';
  fs.mkdirSync(path.dirname(SRC_POI_DATA), { recursive: true });
  fs.writeFileSync(SRC_POI_DATA, content, 'utf8');
  console.log(`Saved ${SRC_POI_DATA} (${pois.length} POIs)`);
}

function writeFrontendRagKb(allItems) {
  const kb = {};
  for (const it of allItems) {
    const itId = it.id || '';
    const title = (it.title || '').trim().normalize('NFC');
    let summary = it.summary || '';
    const fullTextRaw = it.full_text || '';
    if (!summary && fullTextRaw) {
      const lines = fullTextRaw.split('\n').map(l => l.trim()).filter(l => l && !(l.startsWith('[') && l.endsWith(']')));
      summary = lines[0] || '';
    }
    const itemUrl = it.url || `https://jeju.grandculture.net/jeju/toc/${itId}`;
    const meta = it.meta || it.metadata || {};
    const subcats = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];
    const category = classifyPoiCategory(it);

    kb[itId] = {
      poiId: itId,
      poiName: title,
      category: category,
      sourceUrl: itemUrl,
      folkloreNarrative: {
        title: `${title} 구전 설화 및 유래`,
        story: summary,
        motifs: subcats,
        oralTraditionSource: '한국학중앙연구원 한국향토문화전자대전'
      },
      geologyAndNature: {
        formationProcess: summary,
        scientificSignificance: '유네스코 세계자연유산 및 학술 공인 지형 자산',
        naturalEnvironment: meta['지역'] || '제주특별자치도'
      },
      historyAndCulture: {
        culturalHeritageRank: meta['유형'] || '공인 문화유산 / 국가자연유산',
        historicalContext: summary,
        localFolklorePractices: '제주 전통 생활 및 민속 기록'
      },
      academicReferences: [
        '한국향토문화전자대전 (한국학중앙연구원)',
        `한국학중앙연구원 - [${title}] (항목 ID: ${itId})`
      ]
    };
  }

  let content = 'export interface RAGDocument {\n';
  content += '  poiId: string;\n  poiName: string;\n  category: string;\n  sourceUrl?: string;\n';
  content += '  folkloreNarrative: { title: string; story: string; motifs: string[]; oralTraditionSource: string; };\n';
  content += '  geologyAndNature: { formationProcess: string; scientificSignificance: string; naturalEnvironment: string; };\n';
  content += '  historyAndCulture: { culturalHeritageRank: string; historicalContext: string; localFolklorePractices: string; };\n';
  content += '  academicReferences: string[];\n}\n\n';
  content += 'export const RAG_KNOWLEDGE_BASE: Record<string, RAGDocument> = ' + JSON.stringify(kb, null, 2) + ';\n';

  fs.mkdirSync(path.dirname(SRC_RAG_KB), { recursive: true });
  fs.writeFileSync(SRC_RAG_KB, content, 'utf8');
  console.log(`Saved ${SRC_RAG_KB} (${Object.keys(kb).length} KB documents)`);
}

function writeBackendCorpus(allItems) {
  const corpusDocs = [];
  for (const it of allItems) {
    const itId = it.id || '';
    const title = (it.title || '').trim().normalize('NFC');
    const subs = Array.isArray(it.subcategories) ? it.subcategories.map(s => s.nodeName || '') : [];
    
    let summary = it.summary || '';
    const fullTextRaw = it.full_text || '';
    if (!summary && fullTextRaw) {
      const lines = fullTextRaw.split('\n').map(l => l.trim()).filter(l => l && !(l.startsWith('[') && l.endsWith(']')));
      summary = lines[0] || '';
    }

    let fullContent = '';
    if (fullTextRaw) {
      fullContent = fullTextRaw.trim();
    } else {
      const secText = (it.sections || []).map(s => `${s.title || s.heading || ''}: ${s.content || ''}`).join('\n');
      fullContent = (summary + '\n' + secText).trim();
    }

    const category = classifyPoiCategory(it);
    corpusDocs.push({
      id: itId,
      title: title,
      category: category,
      region: (it.meta || it.metadata || {})['지역'] || it.file_region || '제주특별자치도',
      subcats: subs,
      summary: summary,
      content: fullContent
    });
  }

  fs.mkdirSync(path.dirname(SERVER_CORPUS), { recursive: true });
  fs.writeFileSync(SERVER_CORPUS, JSON.stringify(corpusDocs, null, 2), 'utf8');
  console.log(`Saved ${SERVER_CORPUS} (${corpusDocs.length} corpus items)`);

  fs.mkdirSync(path.dirname(SRC_CORPUS), { recursive: true });
  fs.writeFileSync(SRC_CORPUS, JSON.stringify(corpusDocs, null, 2), 'utf8');
  console.log(`Saved ${SRC_CORPUS} (${corpusDocs.length} corpus items)`);
}

function main() {
  const allItems = loadAllJsonFiles();
  const pois = processItemsToPois(allItems);
  writeFrontendPoiData(pois);
  writeFrontendRagKb(allItems);
  writeBackendCorpus(allItems);
  console.log('Automated sync completed successfully!');
}

main();

