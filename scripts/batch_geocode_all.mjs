import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getKakaoRestKey } from './kakaoKey.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const KAKAO_KEY = getKakaoRestKey();
const CACHE_PATH = path.join(ROOT_DIR, 'data', 'jeju_geocache.json');

let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch (e) {
    cache = {};
  }
}

async function fetchKakao(query) {
  const clean = query.trim();
  if (!clean || clean.length < 2) return null;
  if (cache[clean] !== undefined) return cache[clean];

  // 1. Try Address search
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(clean)}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_KEY}`,
        'Origin': 'http://localhost:5173',
        'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/pc origin/http%3A%2F%2Flocalhost%3A5173'
      }
    });
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const lat = parseFloat(doc.y);
      const lng = parseFloat(doc.x);
      if (lat > 33.0 && lat < 34.2 && lng > 126.0 && lng < 127.2) {
        const result = { lat, lng, address: doc.address_name, road: doc.road_address?.address_name, type: 'address' };
        cache[clean] = result;
        return result;
      }
    }
  } catch (e) {}

  // 2. Try Keyword / Place search
  try {
    const kUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(clean)}&category_group_code=AT4,CT1,FD6,CE7,PO3`;
    const res = await fetch(kUrl, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_KEY}`,
        'Origin': 'http://localhost:5173',
        'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/pc origin/http%3A%2F%2Flocalhost%3A5173'
      }
    });
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      // Find document in Jeju
      const jejuDoc = data.documents.find(d => (d.address_name || '').includes('제주') || (d.road_address_name || '').includes('제주'));
      if (jejuDoc) {
        const lat = parseFloat(jejuDoc.y);
        const lng = parseFloat(jejuDoc.x);
        if (lat > 33.0 && lat < 34.2 && lng > 126.0 && lng < 127.2) {
          const result = { lat, lng, address: jejuDoc.address_name, road: jejuDoc.road_address_name, place: jejuDoc.place_name, type: 'keyword' };
          cache[clean] = result;
          return result;
        }
      }
    }
  } catch (e) {}

  // 3. Fallback generic keyword search
  try {
    const kUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(clean)}`;
    const res = await fetch(kUrl, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_KEY}`,
        'Origin': 'http://localhost:5173',
        'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/pc origin/http%3A%2F%2Flocalhost%3A5173'
      }
    });
    const data = await res.json();
    if (data.documents && data.documents.length > 0) {
      const jejuDoc = data.documents.find(d => (d.address_name || '').includes('제주') || (d.road_address_name || '').includes('제주'));
      if (jejuDoc) {
        const lat = parseFloat(jejuDoc.y);
        const lng = parseFloat(jejuDoc.x);
        if (lat > 33.0 && lat < 34.2 && lng > 126.0 && lng < 127.2) {
          const result = { lat, lng, address: jejuDoc.address_name, road: jejuDoc.road_address_name, place: jejuDoc.place_name, type: 'keyword' };
          cache[clean] = result;
          return result;
        }
      }
    }
  } catch (e) {}

  cache[clean] = null;
  return null;
}

// Load all DB items
const dataDirs = [
  path.join(ROOT_DIR, 'data', 'Jeju'),
  path.join(ROOT_DIR, 'data', 'Seogwipo')
];

const allItems = [];
for (const d of dataDirs) {
  if (fs.existsSync(d)) {
    const files = fs.readdirSync(d);
    for (const f of files) {
      if (f.endsWith('.json')) {
        const p = path.join(d, f);
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        const list = Array.isArray(data) ? data : (data.items || []);
        allItems.push(...list);
      }
    }
  }
}

console.log(`Loaded ${allItems.length} total database items. Starting precise Kakao geocoding...`);

async function run() {
  let hits = 0;
  const BATCH_SIZE = 20;

  for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
    const batch = allItems.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (it) => {
      const meta = it.metadata || it.meta || {};
      const title = (it.title || '').replace(/^[「『\(\[\{<]+/, '').replace(/[」』\)\]\}>]+$/, '').trim();
      const loc = meta['소재지'] || meta['위치'] || meta['주소'] || meta['지역'] || '';
      
      const queries = new Set();

      // 1. Bracketed road address e.g. [아란13길 57-49], [삼성로 22]
      const bracketMatch = loc.match(/\[(.*?)\]/);
      if (bracketMatch) {
        const b = bracketMatch[1].trim();
        queries.add(`제주시 ${b}`);
        queries.add(`서귀포시 ${b}`);
        queries.add(`제주특별자치도 ${b}`);
        queries.add(b);
      }

      // 2. Clean loc
      const cleanLoc = loc.replace(/\[.*?\]/g, '').trim();
      if (cleanLoc && cleanLoc.length >= 4) {
        queries.add(cleanLoc);
        queries.add(cleanLoc.replace(/제주특별자치도\s+/, ''));
        queries.add(`제주특별자치도 ${cleanLoc.replace(/제주특별자치도\s+/, '')}`);
      }

      // 3. Bunji matches e.g. "아라동 387", "아라1동 387", "아라일동 387", "삼도1동 983"
      const bunjiMatch = loc.match(/([가-힣\d]+(?:읍|면|동|리))\s+(?:산\s*)?(\d+(?:-\d+)?)/);
      if (bunjiMatch) {
        const dong = bunjiMatch[1];
        const num = bunjiMatch[2];
        const dong1 = dong.replace(/1동/, '일동').replace(/2동/, '이동').replace(/3동/, '삼동');
        const dongNum = dong.replace(/일동/, '1동').replace(/이동/, '2동').replace(/삼동/, '3동');
        const baseDong = dong.replace(/[123일이삼]동/, '동');

        [dong, dong1, dongNum, baseDong].forEach(d => {
          queries.add(`제주특별자치도 제주시 ${d} ${num}`);
          queries.add(`제주특별자치도 서귀포시 ${d} ${num}`);
          queries.add(`제주시 ${d} ${num}`);
          queries.add(`서귀포시 ${d} ${num}`);
          queries.add(`${d} ${num}`);
        });
      }

      // 4. Title search
      if (title && title.length >= 2) {
        queries.add(title);
        queries.add(`제주 ${title}`);
        queries.add(`서귀포 ${title}`);
      }

      for (const q of queries) {
        const res = await fetchKakao(q);
        if (res) {
          hits++;
          break;
        }
      }
    }));

    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= allItems.length) {
      console.log(`[${Math.min(i + BATCH_SIZE, allItems.length)}/${allItems.length}] Hits: ${hits}, Cache Size: ${Object.keys(cache).length}`);
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`✅ Geocoding Finished! Total Hits: ${hits}, Total Items: ${allItems.length}`);
}

run();
