/**
 * build_gcs_data.mjs
 *
 * `sync_data_to_app.mjs` 가 생성한 로컬 데이터(src/data/*)를 GCS 업로드용
 * 산출물로 변환한다. 번들에 인라인되던 40MB를 3단계로 쪼개는 것이 목적이다.
 *
 *   build/gcs/assets/{VERSION}/poi-index.json   검색·지도·최근접 탐색용 슬림 인덱스 (부팅 시 1회)
 *   build/gcs/assets/{VERSION}/poi-cards.json   카루셀 카드용 썸네일+요약 (주변 탐색 첫 오픈 시 1회)
 *   build/gcs/assets/{VERSION}/poi/{id}.json    POI 상세 + RAG 문서 (POI 선택 시 1건)
 *   build/gcs/data/corpus/{VERSION}/ragFullCorpus.json  백엔드 전용 코퍼스
 *
 * 업로드는 scripts/upload_gcs_data.sh 가 담당한다.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERSION = process.env.DATA_VERSION || 'v1';

const SRC_POI = path.join(ROOT, 'src/data/poiData.ts');
const SRC_KB = path.join(ROOT, 'src/data/ragKnowledgeBase.ts');
const SRC_CORPUS = path.join(ROOT, 'src/data/ragFullCorpus.json');

const OUT = path.join(ROOT, 'build/gcs');
const OUT_ASSETS = path.join(OUT, 'assets', VERSION);
const OUT_CORPUS = path.join(OUT, 'data/corpus', VERSION);
const OUT_POI = path.join(OUT, 'data/poi', VERSION);

const mb = (n) => (n / 1048576).toFixed(2) + 'MB';
const kbs = (n) => (n / 1024).toFixed(0) + 'KB';
const gz = (s) => zlib.gzipSync(s).length;

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  hellip: '…',
  ndash: '–',
  mdash: '—'
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
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
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

/** 생성된 TS 모듈에서 리터럴 부분만 떼어내 JSON으로 파싱한다. */
function extractLiteral(file, pattern, label) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} 없음: ${file}\n  → 먼저 \`npm run sync:data\` 를 실행하세요.`);
  }
  const match = fs.readFileSync(file, 'utf8').match(pattern);
  if (!match) throw new Error(`${label} 파싱 실패: ${file} 의 형식이 예상과 다릅니다.`);
  return deepDecode(JSON.parse(match[1]));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const cleaned = deepDecode(value);
  const json = JSON.stringify(cleaned); // minify: sync 스크립트는 pretty 출력이라 여기서 압축
  fs.writeFileSync(file, json, 'utf8');
  return Buffer.byteLength(json);
}

// ── 1. 입력 로드 ────────────────────────────────────────────────────────────
console.log(`\n📦 GCS 데이터 빌드 (version=${VERSION})\n`);

const pois = extractLiteral(
  SRC_POI,
  /export const POI_LIST: POI\[\] = ([\s\S]*);\s*$/,
  'POI_LIST'
);
const rawKb = extractLiteral(
  SRC_KB,
  /export const RAG_KNOWLEDGE_BASE:\s*(?:Record<string,\s*RAGDocument>|RAGDocument\[\])\s*=\s*([\s\S]*);\s*$/,
  'RAG_KNOWLEDGE_BASE'
);
const kb = Array.isArray(rawKb)
  ? Object.fromEntries(rawKb.map((d) => [d.poiId || d.id, d]))
  : rawKb;

if (!fs.existsSync(SRC_CORPUS)) {
  throw new Error(`코퍼스 없음: ${SRC_CORPUS}\n  → 먼저 \`npm run sync:data\` 를 실행하세요.`);
}
const corpus = deepDecode(JSON.parse(fs.readFileSync(SRC_CORPUS, 'utf8')));

console.log(`  입력: POI ${pois.length}건 · KB ${Object.keys(kb).length}건 · 코퍼스 ${corpus.length}건`);

// 기존 산출물 정리 (같은 VERSION 재빌드 시 삭제된 POI 조각이 남지 않도록)
try {
  fs.rmSync(OUT, { recursive: true, force: true });
} catch (e) {
  // Ignore Windows directory lock if dev server is running
}

// ── 2. Tier 1: 슬림 인덱스 ──────────────────────────────────────────────────
// 검색(name/region/tags), 카테고리 필터, geo.ts 최근접 탐색, 캐릭터 배정에 필요한 최소 필드.
const index = pois.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  latitude: p.latitude,
  longitude: p.longitude,
  assignedCharacterId: p.assignedCharacterId,
  tags: p.tags ?? []
}));
const indexBytes = writeJson(path.join(OUT_ASSETS, 'poi-index.json'), index);

// ── 3. Tier 2: 카루셀 카드 ──────────────────────────────────────────────────
// 주변 탐색 시트를 처음 열 때만 필요한 데이터. id 로 인덱스와 조인한다.
// 카드 렌더(썸네일·요약)와 시트 내 딥 서치에 쓰인다.
//
// mythAndFact.details 는 일부러 넣지 않는다 — 이 필드 하나가 gzip 을 329KB 에서
// 1.5MB 로 불린다. 본문 검색은 백엔드 ArchiveSearchTool 이 전체 코퍼스(5,161건)로
// 이미 수행하므로, 클라이언트에 원문을 통째로 내려보낼 이유가 없다.
const cards = {};
for (const p of pois) {
  cards[p.id] = {
    imageUrl: p.imageUrl ?? '',
    summary: p.mythAndFact?.summary ?? '',
    mythTitle: p.mythAndFact?.mythTitle ?? '',
    sampleQuestions: p.sampleQuestions ?? []
  };
}
const cardsBytes = writeJson(path.join(OUT_ASSETS, 'poi-cards.json'), cards);

// ── 4. Tier 3: POI 상세 조각 (상세 + RAG 문서 병합) ─────────────────────────
// 프론트의 두 사용처가 모두 [poi.id] 키 조회라 POI 단위 샤딩이 그대로 맞아떨어진다.
let detailBytesTotal = 0;
let detailGzTotal = 0;
let maxDetailBytes = 0;
let maxDetailId = '';

for (const p of pois) {
  const detail = {
    imageUrl: p.imageUrl ?? '',
    images: p.images ?? [],
    imageTitle: p.imageTitle ?? '',
    imageSource: p.imageSource ?? '',
    sourceUrl: p.sourceUrl,
    mythAndFact: p.mythAndFact ?? { summary: '', details: '' },
    sampleQuestions: p.sampleQuestions ?? [],
    ragDocument: kb[p.id] ?? null
  };
  const filePath = path.join(OUT_ASSETS, 'poi', `${p.id}.json`);
  const size = writeJson(filePath, detail);
  const gzSize = gz(fs.readFileSync(filePath));
  detailBytesTotal += size;
  detailGzTotal += gzSize;
  if (size > maxDetailBytes) {
    maxDetailBytes = size;
    maxDetailId = p.id;
  }
}

// ── 5. 백엔드 코퍼스 ────────────────────────────────────────────────────────
// 백엔드가 검색 시점에만 GCS 에서 1회 내려받는 대용량 코퍼스(18종 5,161건).
const corpusBytes = writeJson(path.join(OUT_CORPUS, 'ragFullCorpus.json'), corpus);

// ── 6. 백엔드 공간 검색용 POI (좌표·이름·카테고리·태그) ──────────────────────
const spatial = pois.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  latitude: p.latitude,
  longitude: p.longitude,
  tags: p.tags ?? []
}));
const spatialBytes = writeJson(path.join(OUT_POI, 'poi-spatial.json'), spatial);

// ── 7. 요약 리포트 ──────────────────────────────────────────────────────────
const indexGz = gz(fs.readFileSync(path.join(OUT_ASSETS, 'poi-index.json')));
const cardsGz = gz(fs.readFileSync(path.join(OUT_ASSETS, 'poi-cards.json')));
const corpusGz = gz(fs.readFileSync(path.join(OUT_CORPUS, 'ragFullCorpus.json')));
const spatialGz = gz(fs.readFileSync(path.join(OUT_POI, 'poi-spatial.json')));

console.log('  ─ 산출물 요약 ─────────────────────────────────────────────');
console.log(`  [assets/${VERSION}]`);
console.log(`    poi-index.json         : ${mb(indexBytes)} (gzip ${kbs(indexGz)})`);
console.log(`    poi-cards.json         : ${mb(cardsBytes)} (gzip ${kbs(cardsGz)})`);
console.log(
  `    poi/{id}.json (${pois.length}개)  : 합계 ${mb(detailBytesTotal)} (gzip ${mb(detailGzTotal)}), 최대 ${kbs(maxDetailBytes)} (${maxDetailId})`
);
console.log(`  [data/corpus/${VERSION}]`);
console.log(`    ragFullCorpus.json     : ${mb(corpusBytes)} (gzip ${kbs(corpusGz)})`);
console.log(`  [data/poi/${VERSION}]`);
console.log(`    poi-spatial.json       : ${mb(spatialBytes)} (gzip ${kbs(spatialGz)})`);
console.log('  ───────────────────────────────────────────────────────────\n');
console.log('✅ GCS 데이터 빌드 완료.');

