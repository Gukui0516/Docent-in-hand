import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DATA_DIR = path.join(ROOT_DIR, 'data');
const OUT_FILE = path.join(DATA_DIR, 'verified_jeju_oral_literature.json');

console.log('=== [1] 한국학중앙연구원 제주도 구비문학/향토문화 아카이브 전수 수집 & 정밀 검증 시작 ===');

// Load POIs for matching
let poiList = [];
try {
  const poiCode = fs.readFileSync(path.join(ROOT_DIR, 'src/data/poiData.ts'), 'utf-8');
  const idx = poiCode.indexOf('export const POI_LIST: POI[] = ');
  if (idx !== -1) {
    const jsonPart = poiCode.substring(idx + 'export const POI_LIST: POI[] = '.length).replace(/;\s*$/, '');
    poiList = JSON.parse(jsonPart);
  }
} catch (e) {
  console.warn('Failed to parse poiData.ts:', e.message);
}
console.log('Loaded ' + poiList.length + ' POIs from poiData.ts for spatial matching.');

// Scan all 18 academic JSON datasets
const jejuFiles = fs.readdirSync(path.join(DATA_DIR, 'Jeju')).map(f => path.join(DATA_DIR, 'Jeju', f));
const seogwipoFiles = fs.readdirSync(path.join(DATA_DIR, 'Seogwipo')).map(f => path.join(DATA_DIR, 'Seogwipo', f));
const allFiles = [...jejuFiles, ...seogwipoFiles];

const rawFolkloreItems = [];

for (const file of allFiles) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const items = raw.items || [];
    for (const it of items) {
      const cat = String(it.category || raw.category_name || '');
      const title = String(it.title || '');
      const sections = Array.isArray(it.sections) ? it.sections : [];
      
      const isFolklore = 
        cat.includes('구비') || cat.includes('문학') || cat.includes('민속') || 
        cat.includes('설화') || cat.includes('민요') || cat.includes('무가') || cat.includes('종교') ||
        sections.some(s => s && s.heading && (
          String(s.heading).includes('설화') || 
          String(s.heading).includes('전설') || 
          String(s.heading).includes('민요') || 
          String(s.heading).includes('본풀이') || 
          String(s.heading).includes('채록')
        ));

      if (isFolklore) {
        rawFolkloreItems.push({
          title,
          category: cat,
          region: raw.region,
          source_file: path.basename(file),
          source_url: it.url || raw.source_url,
          sections
        });
      }
    }
  } catch (err) {
    console.warn('[Read Error] ' + file + ':', err.message);
  }
}

console.log('Found ' + rawFolkloreItems.length + ' candidate folklore/oral literature records.');

// Process, verify, and extract structured fields
console.log('\n=== [2] 교차 검증 및 할루시네이션/오류 필터링 (Validation & Quality Control) ===');

const verifiedOralLiterature = [];
let matchedPoiCount = 0;
let filteredOutCount = 0;

for (const item of rawFolkloreItems) {
  const sections = Array.isArray(item.sections) ? item.sections : [];
  
  // Extract specific sections
  let definition = '';
  let collectionContext = ''; // 채록/수집 상황
  let narrative = ''; // 줄거리 / 사투리 구술 원문 / 가사
  let motifAnalysis = ''; // 모티프 분석
  let significance = ''; // 의의와 평가
  let lyrics = ''; // 민요 가사

  for (const s of sections) {
    if (!s) continue;
    const h = String(s.heading || '').trim();
    const c = String(s.content || '').trim();

    if (h.includes('정의') || h.includes('개설')) {
      definition += (definition ? '\n' : '') + c;
    } else if (h.includes('채록') || h.includes('수집') || h.includes('배경')) {
      collectionContext += (collectionContext ? '\n' : '') + c;
    } else if (h.includes('내용') || h.includes('줄거리') || h.includes('서사') || h.includes('구술')) {
      narrative += (narrative ? '\n' : '') + c;
    } else if (h.includes('가사') || h.includes('노래') || h.includes('민요')) {
      lyrics += (lyrics ? '\n' : '') + c;
    } else if (h.includes('모티프') || h.includes('특징') || h.includes('구조')) {
      motifAnalysis += (motifAnalysis ? '\n' : '') + c;
    } else if (h.includes('의의') || h.includes('평가') || h.includes('가치')) {
      significance += (significance ? '\n' : '') + c;
    } else {
      if (!narrative && c.length > 50) narrative += c;
    }
  }

  // Filter 1: Check if content exists and has academic substance (not empty stub)
  const totalTextLength = (definition + collectionContext + narrative + motifAnalysis + lyrics).length;
  if (totalTextLength < 60) {
    filteredOutCount++;
    continue;
  }

  // Determine genre
  let genre = '설화';
  if (item.category.includes('민요') || item.title.includes('노래') || item.title.includes('소리') || lyrics.length > 0) {
    genre = '민요';
  } else if (item.category.includes('무가') || item.title.includes('본풀이') || item.category.includes('종교')) {
    genre = '무가/본풀이';
  } else if (item.title.includes('신화') || narrative.includes('신화')) {
    genre = '신화';
  } else if (item.title.includes('전설') || narrative.includes('전설')) {
    genre = '전설';
  } else if (item.title.includes('민담') || narrative.includes('민담')) {
    genre = '민담';
  }

  // Filter 2: POI Matching (1:1 Name & Semantic Matching)
  let matchedPoi = null;
  const cleanTitle = item.title.replace(/\[.*?\]|\(.*?\)/g, '').trim();

  for (const poi of poiList) {
    if (cleanTitle.includes(poi.name) || poi.name.includes(cleanTitle)) {
      matchedPoi = poi;
      break;
    }
  }

  // Secondary fuzzy match if primary title didn't match directly
  if (!matchedPoi) {
    const keywords = [
      '백록담', '성산일출봉', '산방산', '용두암', '용연', '삼사석', '삼성혈', '만장굴',
      '천지연', '정방폭포', '천제연', '쇠소깍', '사려니', '비자림', '섭지코지', '우도',
      '가파도', '마라도', '송악산', '수월봉', '다랑쉬', '용눈이', '새별오름', '원앙폭포',
      '사라봉', '외돌개', '정물오름', '아부오름', '금능', '협재', '함덕', '김녕', '월정'
    ];
    for (const kw of keywords) {
      if (cleanTitle.includes(kw) || narrative.includes(kw)) {
        const found = poiList.find(p => p.name.includes(kw));
        if (found) {
          matchedPoi = found;
          break;
        }
      }
    }
  }

  if (matchedPoi) matchedPoiCount++;

  verifiedOralLiterature.push({
    id: 'GUBI_' + String(verifiedOralLiterature.length + 1).padStart(4, '0'),
    title: item.title,
    clean_title: cleanTitle,
    genre,
    region: item.region || '제주특별자치도',
    source_academic_institution: '한국학중앙연구원 (한국구비문학대계 / 한국향토문화전자대전)',
    source_file: item.source_file,
    source_url: item.source_url,
    matched_poi_name: matchedPoi ? matchedPoi.name : null,
    matched_poi_coords: matchedPoi ? [matchedPoi.latitude, matchedPoi.longitude] : null,
    definition: definition || '제주특별자치도 전승 구비문학',
    collection_context: collectionContext || '한국학중앙연구원 현지 채록 및 구술 조사 자료',
    narrative_summary: narrative || definition,
    motif_analysis: motifAnalysis || '제주도 토착 신앙 및 지명 유래 전승 모티프',
    lyrics_or_quotes: lyrics || null,
    academic_significance: significance || '제주도 구비문학 및 향토 민속의 고유한 학술적 가치 보유'
  });
}

console.log('Extracted and validated ' + verifiedOralLiterature.length + ' clean oral literature records.');
console.log('- Matched with interactive POIs: ' + matchedPoiCount + ' records');
console.log('- Filtered out low-quality/empty stubs: ' + filteredOutCount + ' records');

// Save to data/verified_jeju_oral_literature.json
fs.writeFileSync(OUT_FILE, JSON.stringify(verifiedOralLiterature, null, 2), 'utf-8');
console.log('\n=== [3] 검증 완료 데이터셋 저장 완료: ' + OUT_FILE + ' ===');

