/**
 * verify_geocache.mjs — 지오캐시 진단 도구 (파이프라인에 연결돼 있지 않다)
 *
 * 지오캐시에는 카카오 키워드 검색 1순위 결과가 검증 없이 저장돼 있다.
 * "소인국테마파크전시관" 으로 검색해 나온 "전가조형연구소" 를 그대로 넣는 식이라,
 * 실제와 무관한 좌표가 섞여 있다.
 *
 * 이 스크립트는 이름으로 좌표를 받은 항목을 카카오에 재질의해, 돌아온 장소명이
 * 원래 이름과 다르면 반려한다.
 *
 * ⚠️ --apply 는 쓰지 말 것. 이 판별 규칙은 이 데이터에서 못 쓴다고 결론났다.
 *
 *   1,022건 대상 드라이런 결과: 통과 881 · 반려 123 · 검색결과 없음 18
 *   반려 123건을 들여다보니 대부분 오탐이었다.
 *     중문색달해변 → 중문색달해수욕장      같은 곳
 *     관음사의왕벚나무자생지 → 관음사 왕벚나무 자생지   같은 곳
 *     오백장군 → 오백나한                 같은 곳
 *   진짜 오매칭은 소인국테마파크전시관·제주시민회관·화북진성 정도였다.
 *   반려 123건 중 읍·면 앵커로 대조 가능한 14건은 좌표가 전부 맞았다(어긋난 것 0건).
 *   카카오 category_name 으로도 갈라지지 않는다 — 오매칭된 전가조형연구소조차
 *   질의어와 같은 '전시관' 카테고리다.
 *
 *   즉 적용하면 정상 좌표 100여 건을 날리고 얻는 건 서너 건뿐이라, 손 보정
 *   목록(scripts/poi_coord_overrides.json)으로 방향을 바꿨다.
 *
 * 이 파일은 그 근거를 재현하고, 나중에 더 나은 판별 규칙을 시험하려고 남겨둔다.
 * 반려 목록은 build/geocache_rejected.json 에 떨어지니 수동 검토에 쓸 수 있다.
 *
 *   node scripts/verify_geocache.mjs           드라이런 (파일 변경 없음)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getKakaoRestKey } from './kakaoKey.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const HEADERS = {
  Authorization: `KakaoAK ${getKakaoRestKey()}`,
  Origin: 'http://localhost:5173',
  KA: 'sdk/1.0.0 os/javascript lang/ko-KR device/pc origin/http%3A%2F%2Flocalhost%3A5173'
};

const norm = (s) => (s || '').replace(/[\s『』「」()·,.\-]/g, '');

/**
 * 이름이 달라도 맞는 경우가 있다. 제주 오름·봉우리·굴은 고유어와 한자어 이름이
 * 쌍으로 존재한다(도산 오름 = 원당봉, 물메 = 수산봉, 바굼지 오름 = 단산).
 * 이런 자연 지형은 이름 불일치를 허용하고, 건물·시설은 이름 일치를 요구한다.
 * 시설은 별칭이 거의 없어, 이름이 다르면 대개 오매칭이다.
 */
const NATURAL = /(오름|봉|악$|굴|못|물|내$|천$|계곡|폭포|바위|여$|coast|해안|포구|곶)/;
const FACILITY = /(박물관|전시관|미술관|기념관|도서관|센터|공원|학교|교육원|연구원|정보원|시장|호텔|리조트|테마파크|마을|사무소|청사|병원|역$)/;

const dist = (a, b, c, d) => Math.hypot((a - c) * 111, (b - d) * 93) * 1000;

async function search(query) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.documents || [])[0] || null;
}

function accept(poiName, doc) {
  const a = norm(poiName);
  const b = norm(doc.place_name);
  if (a.includes(b) || b.includes(a)) return true;

  // 자연 지형끼리는 별칭 가능성이 높아 통과시킨다.
  if (NATURAL.test(poiName) && NATURAL.test(doc.place_name)) return true;

  // 시설류인데 이름이 겹치지 않으면 오매칭으로 본다.
  if (FACILITY.test(poiName)) return false;

  // 나머지는 부분 토큰이 하나라도 겹치면 통과.
  const tokens = poiName.split(/\s+/).filter((t) => t.length >= 2);
  return tokens.some((t) => doc.place_name.includes(t));
}

const cachePaths = [
  path.join(ROOT, 'scripts/data/jeju_geocache.json'),
  path.join(ROOT, 'data/jeju_geocache.json')
];
const caches = cachePaths.map((p) => ({ p, data: JSON.parse(fs.readFileSync(p, 'utf8')) }));
const merged = {};
for (const { data } of caches) {
  for (const [k, v] of Object.entries(data)) {
    const cur = merged[k];
    if (cur === undefined || ((!cur || typeof cur.lat !== 'number') && v && typeof v.lat === 'number')) merged[k] = v;
  }
}

const pois = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/poiData.ts'), 'utf8')
    .match(/export const POI_LIST: POI\[\] = ([\s\S]*);\s*$/)[1]
);

// POI 이름으로 캐시 좌표를 받은 항목만 검증 대상
const targets = pois.filter((p) => p.hasPreciseLocation !== false && merged[p.name] && merged[p.name].lat);
console.log(`\n🔍 검증 대상 ${targets.length}건 ${APPLY ? '(적용 모드)' : '(드라이런)'}\n`);

const rejected = [];
let pass = 0, noResult = 0, err = 0;

for (let i = 0; i < targets.length; i++) {
  const t = targets[i];
  let doc;
  try { doc = await search(t.name); } catch { err++; continue; }
  if (!doc) { noResult++; continue; }

  const cached = merged[t.name];
  const gap = dist(cached.lat, cached.lng, Number(doc.y), Number(doc.x));

  // 캐시 좌표와 재검색 결과가 멀면 캐시가 다른 것을 가리키고 있을 수 있으나,
  // 판단 근거는 이름 일치 여부다.
  if (accept(t.name, doc)) pass++;
  else rejected.push({ name: t.name, got: doc.place_name, addr: doc.address_name, gap: Math.round(gap) });

  if ((i + 1) % 100 === 0) process.stdout.write(`  ${i + 1}/${targets.length}\r`);
  await new Promise((r) => setTimeout(r, 55));
}

console.log(`  통과 ${pass} · 반려 ${rejected.length} · 검색결과 없음 ${noResult} · 오류 ${err}\n`);
console.log('  반려 목록 (상위 25):');
rejected.slice(0, 25).forEach((r) => console.log(`    ${r.name}  →  ${r.got}  (${r.gap}m)`));

fs.writeFileSync(
  path.join(ROOT, 'build/geocache_rejected.json'),
  JSON.stringify(rejected, null, 2)
);
console.log(`\n  전체 반려 목록: build/geocache_rejected.json`);

if (APPLY) {
  let changed = 0;
  for (const { p, data } of caches) {
    for (const r of rejected) {
      if (data[r.name] && data[r.name].lat) { data[r.name] = null; changed++; }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
  console.log(`  ✅ 캐시 ${changed}개 항목을 null 로 표시했습니다.`);
} else {
  console.log('  (드라이런 — 캐시는 변경하지 않았습니다. --apply 로 반영)');
}
