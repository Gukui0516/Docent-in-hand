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

async function fetchKakaoAddress(query) {
  const clean = query.trim();
  if (!clean) return null;
  if (cache[clean]) return cache[clean];

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
      const result = { lat, lng, address: doc.address_name, road: doc.road_address?.address_name };
      cache[clean] = result;
      return result;
    }
  } catch (e) {
    // ignore
  }

  // Try keyword search if address fails
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
      const doc = data.documents[0];
      const lat = parseFloat(doc.y);
      const lng = parseFloat(doc.x);
      const result = { lat, lng, address: doc.address_name, road: doc.road_address_name, place: doc.place_name };
      cache[clean] = result;
      return result;
    }
  } catch (e) {
    // ignore
  }

  cache[clean] = null;
  return null;
}

export async function geocodeJejuItems(items) {
  let resolvedCount = 0;
  let kakaoHits = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const meta = it.metadata || it.meta || {};
    const title = it.title || it.name || '';
    const loc = meta['소재지'] || meta['위치'] || meta['지역'] || '';
    
    // Extract address candidates
    const candidates = [];
    
    // 1. Bracketed road address e.g. "아라동 2025-2[아란13길 57-49]"
    const bracketMatch = loc.match(/\[(.*?)\]/);
    if (bracketMatch) candidates.push(bracketMatch[1]);

    // 2. Full location without brackets
    const cleanLoc = loc.replace(/\[.*?\]/g, '').trim();
    if (cleanLoc && cleanLoc.length > 5) candidates.push(cleanLoc);

    // 3. Dong + Bunji e.g. "아라동 2025-2"
    const bunjiMatch = loc.match(/([가-힣\d]+(?:읍|면|동|리))\s+(?:산\s*)?(\d+(?:-\d+)?)/);
    if (bunjiMatch) candidates.push(`제주시 ${bunjiMatch[0]}`);

    // 4. Place name + Jeju
    candidates.push(`제주 ${title.replace(/[「」『』]/g, '')}`);

    let hit = null;
    for (const c of candidates) {
      if (!c || c.length < 3) continue;
      hit = await fetchKakaoAddress(c);
      if (hit) {
        kakaoHits++;
        it._geocoded = [hit.lat, hit.lng];
        break;
      }
    }

    if ((i + 1) % 100 === 0 || i === items.length - 1) {
      console.log(`Geocoding progress: ${i + 1}/${items.length} (Kakao hits: ${kakaoHits})`);
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`Geocoding completed. Total Kakao hits: ${kakaoHits}/${items.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Testing geocoder on sample items...');
  fetchKakaoAddress('제주시 아라동 2025-2[아란13길 57-49]').then(r => console.log('Sample result:', r));
}
