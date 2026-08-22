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

/** 생성된 TS 모듈에서 리터럴 부분만 떼어내 JSON으로 파싱한다. */
function extractLiteral(file, pattern, label) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} 없음: ${file}\n  → 먼저 \`npm run sync:data\` 를 실행하세요.`);
  }
  const match = fs.readFileSync(file, 'utf8').match(pattern);
  if (!match) throw new Error(`${label} 파싱 실패: ${file} 의 형식이 예상과 다릅니다.`);
  return JSON.parse(match[1]);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const json = JSON.stringify(value); // minify: sync 스크립트는 pretty 출력이라 여기서 압축
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
const kb = extractLiteral(
  SRC_KB,
  /export const RAG_KNOWLEDGE_BASE: Record<string, RAGDocument> = ([\s\S]*);\s*$/,
  'RAG_KNOWLEDGE_BASE'
);

if (!fs.existsSync(SRC_CORPUS)) {
  throw new Error(`코퍼스 없음: ${SRC_CORPUS}\n  → 먼저 \`npm run sync:data\` 를 실행하세요.`);
}
const corpus = JSON.parse(fs.readFileSync(SRC_CORPUS, 'utf8'));

console.log(`  입력: POI ${pois.length}건 · KB ${Object.keys(kb).length}건 · 코퍼스 ${corpus.length}건`);

// 기존 산출물 정리 (같은 VERSION 재빌드 시 삭제된 POI 조각이 남지 않도록)
fs.rmSync(OUT, { recursive: true, force: true });

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
// 주변 탐색 시트를 처음 열 때만 필요한 썸네일 + 한 줄 요약. id 로 인덱스와 조인한다.
const cards = {};
for (const p of pois) {
  cards[p.id] = {
    imageUrl: p.imageUrl ?? '',
    summary: p.mythAndFact?.summary ?? ''
  };
}
const cardsBytes = writeJson(path.join(OUT_ASSETS, 'poi-cards.json'), cards);

// ── 4. Tier 3: POI 상세 조각 (상세 + RAG 문서 병합) ─────────────────────────
// 프론트의 두 사용처가 모두 [poi.id] 키 조회라 POI 단위 샤딩이 그대로 맞아떨어진다.
//   ragService.ts:17   RAG_KNOWLEDGE_BASE[poi.id]
//   StoryCard.tsx:18   RAG_KNOWLEDGE_BASE[poi.id]
let shardTotal = 0;
let shardMax = 0;
let withKb = 0;

for (const p of pois) {
  const detail = {
    id: p.id,
    imageUrl: p.imageUrl ?? '',
    images: p.images ?? [],
    imageTitle: p.imageTitle ?? '',
    imageSource: p.imageSource ?? '',
    sourceUrl: p.sourceUrl,
    mythAndFact: p.mythAndFact ?? { summary: '', details: '' },
    sampleQuestions: p.sampleQuestions ?? [],
    ragDocument: kb[p.id] ?? null
  };
  if (detail.ragDocument) withKb++;
  const bytes = writeJson(path.join(OUT_ASSETS, 'poi', `${p.id}.json`), detail);
  shardTotal += bytes;
  if (bytes > shardMax) shardMax = bytes;
}

// KB 에만 있고 POI 목록에 없는 항목이 있으면 조용히 유실되므로 경고한다.
const orphanKb = Object.keys(kb).filter((id) => !pois.some((p) => p.id === id));
if (orphanKb.length) {
  console.warn(`  ⚠️  POI 목록에 없는 KB 문서 ${orphanKb.length}건은 조각으로 생성되지 않았습니다.`);
}

// ── 5. 백엔드 전용 POI 파일 ─────────────────────────────────────────────────
// spatialSearchTool 이 근접 검색 결과에 summary 를 실어 보내므로 요약이 필요하다.
// 브라우저 인덱스(Tier 1)를 무겁게 하지 않으려고 비공개 data 버킷에 따로 둔다.
const spatial = pois.map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  region: p.region,
  latitude: p.latitude,
  longitude: p.longitude,
  tags: p.tags ?? [],
  mythAndFact: { summary: p.mythAndFact?.summary ?? '' }
}));
const spatialBytes = writeJson(path.join(OUT_POI, 'poi-spatial.json'), spatial);

// ── 6. 백엔드 코퍼스 (minify 만) ────────────────────────────────────────────
const corpusBytes = writeJson(path.join(OUT_CORPUS, 'ragFullCorpus.json'), corpus);

// ── 7. 리포트 ───────────────────────────────────────────────────────────────
const indexGz = gz(fs.readFileSync(path.join(OUT_ASSETS, 'poi-index.json')));
const cardsGz = gz(fs.readFileSync(path.join(OUT_ASSETS, 'poi-cards.json')));
const spatialGz = gz(fs.readFileSync(path.join(OUT_POI, 'poi-spatial.json')));
const corpusGz = gz(fs.readFileSync(path.join(OUT_CORPUS, 'ragFullCorpus.json')));

console.log(`
  ── assets (Cloud Run 프록시로 브라우저에 전달) ──
  poi-index.json   ${mb(indexBytes).padStart(8)}  gzip ${kbs(indexGz).padStart(7)}   부팅 시 1회
  poi-cards.json   ${mb(cardsBytes).padStart(8)}  gzip ${kbs(cardsGz).padStart(7)}   주변 탐색 첫 오픈 시 1회
  poi/*.json       ${mb(shardTotal).padStart(8)}  ${pois.length}개 조각 (최대 ${kbs(shardMax)}) · RAG 병합 ${withKb}건

  ── data (백엔드 전용, 브라우저 미노출) ──
  poi-spatial.json ${mb(spatialBytes).padStart(8)}  gzip ${kbs(spatialGz).padStart(7)}   서버 기동 시 1회
  ragFullCorpus    ${mb(corpusBytes).padStart(8)}  gzip ${kbs(corpusGz).padStart(7)}   서버 기동 시 1회

  ✅ 산출물: build/gcs/
`);
