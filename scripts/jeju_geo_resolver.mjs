import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Path to 74k official Jeju POI CSV
const POI_CSV_PATH = path.resolve(ROOT_DIR, '../제주특별자치도_제주도장소POI데이터_20151231.csv');

// Built-in verified Landmark Dictionary (High Precision Anchor Points)
export const VERIFIED_LANDMARKS = {
  // 용담/한천/제주 원도심 수계 및 명소
  '용소': [33.5152, 126.5140],
  '용소(龍沼)': [33.5152, 126.5140],
  '용연': [33.5152, 126.5140],
  '용연계곡': [33.5152, 126.5140],
  '취병담': [33.5152, 126.5140],
  '용연구름다리': [33.5149, 126.5143],
  '용두암': [33.5165, 126.5126],
  '용머리바위': [33.5165, 126.5126], // 제주시 용담동 용두암(용머리바위)
  '용머리': [33.5165, 126.5126],
  '말머리': [33.5168, 126.5105],
  '말머리바위': [33.5168, 126.5105],
  '무근성': [33.5125, 126.5195],
  '관덕정': [33.5130, 126.5225],
  '제주목관아': [33.5130, 126.5225],
  '삼성혈': [33.4988, 126.5312],
  '삼성혈비': [33.4988, 126.5312],
  '민속자연사박물관': [33.4996, 126.5342],
  '삼사석': [33.5222, 126.5678],
  '오현단': [33.5105, 126.5295],
  '귤림서원': [33.5105, 126.5295],
  '제주향교': [33.5085, 126.5165],
  '동문시장': [33.5126, 126.5282],
  '산지천': [33.5145, 126.5285],
  '김만덕기념관': [33.5146, 126.5288],
  '칠머리당': [33.5215, 126.5415],
  '사라봉': [33.5228, 126.5458],
  '별도봉': [33.5235, 126.5532],
  '원당봉': [33.5245, 126.5925],
  '불탑사': [33.5245, 126.5925],
  '원당사지': [33.5245, 126.5925],
  '화북진': [33.5235, 126.5650],
  '조천진': [33.5400, 126.6350],
  '연북정': [33.5400, 126.6350],
  '항일기념관': [33.5398, 126.6432],
  '너븐숭이': [33.5417, 126.6945],
  '너븐숭이4·3기념관': [33.5417, 126.6945],
  '도두봉': [33.5069, 126.4677],
  '오래물': [33.5035, 126.4682],
  '이호테우': [33.4981, 126.4529],
  '이호해수욕장': [33.4981, 126.4529],
  '외도물길': [33.4925, 126.4350],
  '월대천': [33.4912, 126.4365],
  '방선문': [33.4542, 126.5225],

  // 환해장성 각 지점
  '곤을동환해장성': [33.5265, 126.5680],
  '별도환해장성': [33.5270, 126.5620],
  '삼양환해장성': [33.5260, 126.5890],
  '화북환해장성': [33.5250, 126.5660],
  '애월환해장성': [33.4650, 126.3320],
  '북촌환해장성': [33.5450, 126.6920],
  '행원환해장성': [33.5590, 126.8120],
  '한동환해장성': [33.5480, 126.8320],
  '온평환해장성': [33.4120, 126.9050],
  '신산환해장성': [33.3920, 126.8920],

  // 한라산 및 산악/오름
  '백록담': [33.3617, 126.5332],
  '백록담 마애명': [33.3617, 126.5332],
  '백록담 전설': [33.3617, 126.5332],
  '한라산': [33.3617, 126.5332],
  '영실': [33.3541, 126.4975],
  '영실기암': [33.3541, 126.4975],
  '오백장군': [33.3541, 126.4975],
  '오백 장군 전설': [33.3541, 126.4975],
  '어리목': [33.3918, 126.4932],
  '성판악': [33.3842, 126.6175],
  '관음사': [33.4218, 126.5591],
  '어승생악': [33.3945, 126.4955],
  '사려니숲길': [33.4077, 126.6433],
  '사려니': [33.4077, 126.6433],
  '물찻오름': [33.4125, 126.6450],
  '거문오름': [33.4599, 126.7136],
  '산굼부리': [33.4338, 126.6882],
  '새별오름': [33.3665, 126.3562],
  '노꼬메': [33.4075, 126.4275],
  '다랑쉬오름': [33.4735, 126.8335],
  '용눈이오름': [33.4608, 126.8327],
  '아부오름': [33.4475, 126.7775],
  '따라비오름': [33.3855, 126.7525],
  '물영아리': [33.3705, 126.6932],
  '물영아리오름': [33.3705, 126.6932],
  '군산오름': [33.2541, 126.3685],
  '군산': [33.2541, 126.3685],
  '군산의 금장지': [33.2541, 126.3685],
  '수월봉': [33.2952, 126.1627],
  '송악산': [33.2003, 126.2902],
  '산방산': [33.2366, 126.3134],
  '산방산 전설': [33.2366, 126.3134],
  '산방산 금장지': [33.2366, 126.3134],
  '산방굴사': [33.2366, 126.3134],
  '성산일출봉': [33.4585, 126.9427],
  '지미봉': [33.5132, 126.9075],
  '비자림': [33.4913, 126.8337],
  '만장굴': [33.5284, 126.7716],
  '김녕굴': [33.5350, 126.7680],
  '협재굴': [33.3900, 126.2400],
  '쌍용굴': [33.3905, 126.2410],
  '미천굴': [33.3775, 126.8575],

  // 서귀포 해안/폭포/문화유적
  '천지연폭포': [33.2448, 126.5595],
  '천지연': [33.2448, 126.5595],
  '정방폭포': [33.2449, 126.5719],
  '정방': [33.2449, 126.5719],
  '천제연폭포': [33.2526, 126.4184],
  '천제연': [33.2526, 126.4184],
  '엉또폭포': [33.2685, 126.5025],
  '엉또': [33.2685, 126.5025],
  '원앙폭포': [33.3005, 126.5875],
  '돈내코': [33.3005, 126.5875],
  '외돌개': [33.2403, 126.5458],
  '주상절리': [33.2378, 126.4249],
  '대포주상절리': [33.2378, 126.4249],
  '용머리해안': [33.2324, 126.3148], // 서귀포시 안덕면 사계리 산방산 앞바다 용머리해안
  '사계리 용머리': [33.2324, 126.3148],
  '용머리 전설': [33.2324, 126.3148],
  '혼인지': [33.4195, 126.9035],
  '혼인지 전설': [33.4195, 126.9035],
  '토산 여드렛당': [33.3180, 126.7767],
  '토산 일뤳당': [33.3180, 126.7767],
  '토산 여드렛당 신화': [33.3180, 126.7767],
  '토산 일뤳당 신화': [33.3180, 126.7767],
  '쇠소깍': [33.2527, 126.6234],
  '섭지코지': [33.4241, 126.9298],
  '이중섭거리': [33.2458, 126.5648],
  '이중섭미술관': [33.2458, 126.5648],
  '소암기념관': [33.2425, 126.5742],
  '기당미술관': [33.2428, 126.5512],
  '서귀진': [33.2435, 126.5675],
  '성읍민속마을': [33.3871, 126.7997],
  '정의향교': [33.3850, 126.7950],
  '대정향교': [33.2385, 126.2875],
  '추사관': [33.2392, 126.2845],
  '추사적거지': [33.2392, 126.2845],
  '항파두리': [33.4523, 126.4112],
  '별방진': [33.5285, 126.8775],
  '명월진': [33.3775, 126.2575],
  '수산진': [33.4400, 126.8950],
  '송당본향당': [33.4685, 126.7650],
  '백주또': [33.4685, 126.7650],
  '와흘본향당': [33.4925, 126.6550],
  '새미소': [33.4625, 126.7450],
  '금산공원': [33.4358, 126.3312],
  '감귤박물관': [33.2715, 126.6048],
  '서귀포감귤박물관': [33.2715, 126.6048],
  '제주도립미술관': [33.4532, 126.4895],
  '제주4·3평화공원': [33.4512, 126.6198],
  '돌문화공원': [33.4478, 126.6612],
  '설문대할망': [33.4478, 126.6612],
  '설문대 할망': [33.4478, 126.6612],
  '해녀박물관': [33.5242, 126.8624],

  // 해수욕장 & 해변
  '협재해수욕장': [33.3941, 126.2397],
  '금능해수욕장': [33.3905, 126.2355],
  '곽지해수욕장': [33.4509, 126.3106],
  '함덕해수욕장': [33.5434, 126.6692],
  '김녕해수욕장': [33.5574, 126.7594],
  '월정리해수욕장': [33.5562, 126.7958],
  '세화해수욕장': [33.5251, 126.8529],
  '표선해수욕장': [33.3255, 126.8406],
  '중문색달해변': [33.2452, 126.4116],
  '삼양해수욕장': [33.5244, 126.5861],
  '화순금모래해변': [33.2392, 126.3355],
  '신양섭지해수욕장': [33.4325, 126.9245],
  '하모해수욕장': [33.2145, 126.2565],

  // 도서 지역
  '우도': [33.5043, 126.9542],
  '비양도': [33.4072, 126.2272],
  '가파도': [33.1678, 126.2731],
  '마라도': [33.1165, 126.2682],
  '차귀도': [33.3135, 126.1472],
  '추자도': [33.9575, 126.2975]
};

export class JejuGeoResolver {
  constructor() {
    this.poiByName = new Map();
    this.poiByNormalizedName = new Map();
    this.poiByAddress = new Map();
    this.riCentroids = new Map();
    this.initialized = false;
  }

  normalizeName(str) {
    if (!str) return '';
    return str
      .replace(/^[「『\(\[\{<]+/, '')
      .replace(/[」』\)\]\}>]+$/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, '')
      .trim()
      .normalize('NFC');
  }

  normalizeAddress(addr) {
    if (!addr) return '';
    return addr
      .replace(/\s+/g, ' ')
      .replace(/제주특별자치도\s+/, '')
      .replace(/번지$/, '')
      .replace(/일동/g, '1동')
      .replace(/이동/g, '2동')
      .replace(/삼동/g, '3동')
      .trim();
  }

  generateDongAliases(rawName) {
    if (!rawName) return [];
    const set = new Set();
    const clean = rawName.trim();
    set.add(clean);

    // Number to Korean conversion
    const numToKor = clean
      .replace(/1동/g, '일동')
      .replace(/2동/g, '이동')
      .replace(/3동/g, '삼동');
    set.add(numToKor);

    // Korean to Number conversion
    const korToNum = clean
      .replace(/일동/g, '1동')
      .replace(/이동/g, '2동')
      .replace(/삼동/g, '3동');
    set.add(korToNum);

    // Base dong without suffix (e.g. 화북동 from 화북1동/화북일동)
    const base = clean.replace(/[123일이삼]동/g, '동');
    set.add(base);

    return Array.from(set);
  }

  init() {
    if (this.initialized) return;
    const start = Date.now();

    // 1. Preload Verified Landmarks
    for (const [k, coords] of Object.entries(VERIFIED_LANDMARKS)) {
      const norm = this.normalizeName(k);
      this.poiByNormalizedName.set(norm, { lat: coords[0], lng: coords[1], name: k, type: '랜드마크' });
    }

    // 2. Load 74k POI CSV
    if (fs.existsSync(POI_CSV_PATH)) {
      try {
        const buf = fs.readFileSync(POI_CSV_PATH);
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buf);
        const lines = text.split('\n');

        const riData = new Map();

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = line.split(',');
          if (parts.length >= 6) {
            const lng = parseFloat(parts[1]);
            const lat = parseFloat(parts[2]);
            const type = parts[3];
            const name = parts[4].trim();
            const addr = parts[5].trim();

            if (lat > 33.1 && lat < 34.0 && lng > 126.1 && lng < 127.0) {
              const poiItem = { lat, lng, addr, type, name };

              if (!this.poiByName.has(name)) this.poiByName.set(name, []);
              this.poiByName.get(name).push(poiItem);

              const normName = this.normalizeName(name);
              if (normName && !this.poiByNormalizedName.has(normName)) {
                this.poiByNormalizedName.set(normName, poiItem);
              }

              if (addr) {
                const normAddr = this.normalizeAddress(addr);
                if (!this.poiByAddress.has(normAddr)) {
                  this.poiByAddress.set(normAddr, poiItem);
                }

                // Group by Ri/Dong for high-precision Village centroids
                const riMatch = addr.match(/^(?:제주특별자치도\s+)?(제주시|서귀포시)\s+([가-힣\d]+(?:읍|면|동))\s*([가-힣\d]+(?:리|동))?/);
                if (riMatch) {
                  const city = riMatch[1];
                  const eup = riMatch[2];
                  const ri = riMatch[3] || eup;

                  const candidateKeys = [];
                  for (const eAlias of this.generateDongAliases(eup)) {
                    for (const rAlias of this.generateDongAliases(ri)) {
                      candidateKeys.push(`${city} ${eAlias} ${rAlias}`.trim());
                      candidateKeys.push(`${eAlias} ${rAlias}`.trim());
                      candidateKeys.push(rAlias);
                      candidateKeys.push(eAlias);
                    }
                  }

                  for (const k of candidateKeys) {
                    if (!riData.has(k)) riData.set(k, { sumLat: 0, sumLng: 0, count: 0 });
                    const rd = riData.get(k);
                    rd.sumLat += lat;
                    rd.sumLng += lng;
                    rd.count++;
                  }
                }
              }
            }
          }
        }

        // Calculate centroids
        for (const [k, d] of riData.entries()) {
          if (d.count > 0) {
            this.riCentroids.set(k, [
              Number((d.sumLat / d.count).toFixed(6)),
              Number((d.sumLng / d.count).toFixed(6))
            ]);
          }
        }

        console.log(`[JejuGeoResolver] Initialized with ${this.poiByName.size} unique places, ${this.poiByAddress.size} addresses, and ${this.riCentroids.size} Ri/Dong centroids in ${Date.now() - start}ms`);
      } catch (e) {
        console.error('[JejuGeoResolver] CSV loading error:', e.message);
      }
    }

    this.initialized = true;
  }

  resolveCoordinates(item) {
    if (!this.initialized) this.init();

    const title = (item.title || '').trim().normalize('NFC');
    const normTitle = this.normalizeName(title);
    const meta = item.metadata || item.meta || {};
    const regionStr = meta['지역'] || item.file_region || '제주시';
    const relatedPlaces = meta['관련지명'] ? meta['관련지명'].split('|').map(p => this.normalizeName(p)).filter(Boolean) : [];
    const locationStr = meta['소재지'] || meta['위치'] || meta['주소'] || '';

    // Combine text for contextual analysis
    const sections = item.sections || [];
    let secText = '';
    let openIntro = '';
    let locationSec = '';

    for (const s of sections) {
      const heading = s.heading || s.title || '';
      const content = s.content || (s.paragraphs ? s.paragraphs.join(' ') : '') || '';
      if (heading.includes('개설') || heading.includes('정의')) openIntro += ' ' + content;
      if (heading.includes('위치') || heading.includes('소재지')) locationSec += ' ' + content;
      secText += ' ' + content;
    }

    const summary = item.summary || '';
    const fullText = (summary + ' ' + openIntro + ' ' + locationSec + ' ' + secText).trim();

    // ─────────────────────────────────────────────────────────────────────────────
    // Tier 1: Exact / High-Confidence Landmark Dictionary Match
    // ─────────────────────────────────────────────────────────────────────────────
    // Check specific lore / place names in title
    for (const [key, coords] of Object.entries(VERIFIED_LANDMARKS)) {
      const normKey = this.normalizeName(key);
      if (normTitle === normKey || normTitle.includes(normKey)) {
        return coords;
      }
    }

    // Check related places (관련지명)
    for (const rp of relatedPlaces) {
      for (const [key, coords] of Object.entries(VERIFIED_LANDMARKS)) {
        const normKey = this.normalizeName(key);
        if (rp === normKey || rp.includes(normKey)) {
          return coords;
        }
      }
      if (this.poiByNormalizedName.has(rp)) {
        const p = this.poiByNormalizedName.get(rp);
        return [p.lat, p.lng];
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Tier 2: Specific Street Address / Parcel (지번) Match from Location & Text
    // ─────────────────────────────────────────────────────────────────────────────
    const candidateTexts = [locationStr, locationSec, openIntro, summary, regionStr, fullText];

    for (const txt of candidateTexts) {
      if (!txt) continue;

      // Extract e.g. "용담2동 2581", "교래리 산 137-1", "협재리 2497-1번지", "성산리 114"
      const addrMatch = txt.match(/([가-힣\d]+(?:읍|면|동))\s+([가-힣\d]+(?:리|동))\s+(?:산\s*)?(\d+(?:-\d+)?)(?:번지)?/);
      if (addrMatch) {
        const normKey = this.normalizeAddress(`${addrMatch[1]} ${addrMatch[2]} ${addrMatch[3]}`);
        if (this.poiByAddress.has(normKey)) {
          const p = this.poiByAddress.get(normKey);
          return [p.lat, p.lng];
        }
      }

      const dongAddrMatch = txt.match(/([가-힣\d]+(?:리|동))\s+(?:산\s*)?(\d+(?:-\d+)?)(?:번지)?/);
      if (dongAddrMatch) {
        const partialKey = this.normalizeAddress(`${dongAddrMatch[1]} ${dongAddrMatch[2]}`);
        for (const [aKey, p] of this.poiByAddress.entries()) {
          if (aKey.includes(partialKey)) {
            return [p.lat, p.lng];
          }
        }
      }

      // Road address e.g. "삼성로 22", "중문관광로 224", "일주동로 5413"
      const roadMatch = txt.match(/([가-힣\d]+(?:로|길))\s+(\d+(?:-\d+)?)/);
      if (roadMatch) {
        const rKey = `${roadMatch[1]} ${roadMatch[2]}`;
        for (const [aKey, p] of this.poiByAddress.entries()) {
          if (aKey.includes(rKey)) {
            return [p.lat, p.lng];
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Tier 3: Contextual Geographic Features in Text (하천/계곡/오름/포구/당/바위/굴)
    // ─────────────────────────────────────────────────────────────────────────────
    for (const [key, coords] of Object.entries(VERIFIED_LANDMARKS)) {
      if (openIntro.includes(key) || summary.includes(key) || locationSec.includes(key) || title.includes(key)) {
        return coords;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Tier 4: Specific Ri/Dong Centroid Match (Village-Level Precision)
    // ─────────────────────────────────────────────────────────────────────────────
    // Search for Ri/Dong in regionStr, text, or title
    const searchStrings = [regionStr, locationStr, openIntro, summary, title];
    for (const str of searchStrings) {
      if (!str) continue;
      const m = str.match(/([가-힣\d]+(?:리|동))/g);
      if (m) {
        for (const ri of m) {
          if (['제주특별자치도', '제주시', '서귀포시', '읍', '면'].includes(ri)) continue;
          for (const alias of this.generateDongAliases(ri)) {
            if (this.riCentroids.has(alias)) {
              return this.riCentroids.get(alias);
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Tier 5: Eup/Myeon Centroid Fallback
    // ─────────────────────────────────────────────────────────────────────────────
    for (const str of [regionStr, title]) {
      const m = str.match(/([가-힣]+(?:읍|면))/g);
      if (m) {
        for (const eup of m) {
          if (this.riCentroids.has(eup)) {
            return this.riCentroids.get(eup);
          }
        }
      }
    }

    // Fallback based on city
    if (regionStr.includes('서귀포') || (item.file_region && item.file_region.includes('서귀포'))) {
      return [33.2541, 126.5600]; // Seogwipo center
    }

    // Default safe Jeju city center
    return [33.4996, 126.5312];
  }
}

export const jejuGeoResolver = new JejuGeoResolver();
