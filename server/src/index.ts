import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config/env.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { initArchiveCorpus, getCorpusSize } from './agents/tools/archiveSearchTool.js';
import { initSpatialPOIs, getSpatialPOICount } from './agents/tools/spatialSearchTool.js';
import { openAssetStream, uploadAsset } from './data/gcsSource.js';
import { randomUUID } from 'crypto';
import { GROUNDING_TEST_CASES, GroundingEvaluationService } from './services/groundingEvaluationService.js';
import { communityStoryService } from './services/communityStoryService.js';

const app = express();

// 프로덕션에서는 프론트와 백엔드가 같은 Cloud Run 오리진이라 CORS 가 필요 없다.
// 로컬 개발에서만 Vite dev 서버(5173)를 허용한다.
app.use(cors({ origin: CONFIG.IS_PRODUCTION ? false : ['http://localhost:5173'] }));

// express.static 은 압축을 하지 않는다. 이게 없으면 프론트 번들이 600KB 무압축으로
// 나간다(gzip 이면 133KB). SSE 와 이미 gzip 인 /data 프록시 응답은 건드리지 않는다.
app.use(
  compression({
    filter: (req, res) => {
      const type = String(res.getHeader('Content-Type') ?? '');
      if (type.includes('text/event-stream')) return false;
      if (res.getHeader('Content-Encoding')) return false;
      return compression.filter(req, res);
    }
  })
);

// 기본 한도 100kb 로는 사진 첨부가 413 으로 실패한다. 클라이언트가 캔버스로
// 1280px JPEG 로 줄여 보내므로 보통 300KB 안쪽이고, 여유를 둬 6MB 로 잡는다.
app.use(express.json({ limit: '6mb' }));

// ── 쓰기 요청 레이트 리밋 ───────────────────────────────────────────────────
// 방명록은 인증이 없는 공개 엔드포인트다. IP 당 분당 20회로 제한해 스팸을 늦춘다.
// 인스턴스별 인메모리 카운터라 완벽하진 않지만(최대 5인스턴스), 없는 것보다 낫다.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function writeLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= RATE_MAX) {
    res.status(429).json({ error: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' });
    return;
  }

  bucket.count++;
  next();
}

// 버킷이 무한정 쌓이지 않도록 주기적으로 만료분을 비운다.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) if (now > b.resetAt) rateBuckets.delete(ip);
}, RATE_WINDOW_MS).unref();

// ── 헬스 체크 ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Docent-in-Hand Multi-Agent Backend',
    model: CONFIG.GEMINI_MODEL,
    hasApiKey: Boolean(CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.length > 5),
    corpusDocs: getCorpusSize(),
    spatialPOIs: getSpatialPOICount()
  });
});

// ── 환각 방지 및 팩트 그라운딩 평가 API ──────────────────────────────────────────
app.get('/api/eval/test-cases', (req, res) => {
  res.json({
    totalCount: GROUNDING_TEST_CASES.length,
    testCases: GROUNDING_TEST_CASES
  });
});

app.post('/api/eval/run-test', async (req, res) => {
  const { testCaseId, poiName, query } = req.body;

  try {
    let targetPoi = poiName;
    let targetQuery = query;
    let testCaseMeta = undefined;

    if (testCaseId) {
      const found = GROUNDING_TEST_CASES.find(c => c.id === testCaseId);
      if (found) {
        testCaseMeta = found;
        targetPoi = found.poiName;
        targetQuery = found.query;
      }
    }

    if (!targetPoi || !targetQuery) {
      res.status(400).json({ error: 'poiName and query (or valid testCaseId) are required' });
      return;
    }

    const result = await GroundingEvaluationService.runTest(targetPoi, targetQuery, testCaseMeta);
    res.json(result);
  } catch (err: any) {
    console.error('Grounding evaluation error:', err);
    res.status(500).json({ error: err.message || '평가 테스트 실행 중 오류가 발생했습니다.' });
  }
});

// ── 방명록 / 우리의 제주 이야기 API ──────────────────────────────────────────
//
// 공개 URL 이라 누구나 호출할 수 있다. 인증은 없지만 최소한의 남용 방어로
// IP 당 쓰기 요청에 레이트 리밋을 건다.
app.get('/api/stories', async (req, res) => {
  const { poiId } = req.query;
  try {
    const stories =
      poiId && typeof poiId === 'string'
        ? await communityStoryService.getStoriesByPoiId(poiId)
        : await communityStoryService.getAllStories();

    res.json({
      ...(typeof poiId === 'string' ? { poiId } : {}),
      totalCount: stories.length,
      stories
    });
  } catch (err: any) {
    console.error('스토리 조회 오류:', err);
    res.status(500).json({ error: '이야기 목록을 불러오지 못했습니다.' });
  }
});

app.post('/api/stories', writeLimiter, async (req, res) => {
  const { poiId, authorName, authorType, category, content, imageUrl } = req.body;

  if (!poiId || !content || !content.trim()) {
    res.status(400).json({ error: 'poiId와 content는 필수 항목입니다.' });
    return;
  }

  // data: URL 이 그대로 넘어오면 Firestore 문서 1MiB 한도를 넘긴다.
  // 사진은 /api/stories/photo 로 먼저 올려 URL 을 받아야 한다.
  if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
    res.status(400).json({ error: '사진은 /api/stories/photo 로 업로드한 뒤 URL 을 전달해 주세요.' });
    return;
  }

  try {
    const created = await communityStoryService.createStory({
      poiId,
      authorName,
      authorType,
      category,
      content,
      imageUrl
    });
    res.status(201).json(created);
  } catch (err: any) {
    console.error('스토리 생성 오류:', err);
    res.status(500).json({ error: '이야기 등록 중 서버 오류가 발생했습니다.' });
  }
});

app.post('/api/stories/:id/like', writeLimiter, async (req, res) => {
  // @types/express 는 v5 인데 런타임은 express 4 라 params 값이 string | string[] 로 잡힌다.
  const id = String(req.params.id);
  const { isLike = true } = req.body;

  try {
    const result = await communityStoryService.toggleLike(id, Boolean(isLike));
    if (!result.found) {
      res.status(404).json({ error: '해당 이야기를 찾을 수 없습니다.' });
      return;
    }
    res.json({ id, likes: result.likes });
  } catch (err: any) {
    console.error('공감 처리 오류:', err);
    res.status(500).json({ error: '공감 처리 중 서버 오류가 발생했습니다.' });
  }
});

// ── 방명록 사진 업로드 ──────────────────────────────────────────────────────
// 사진을 Firestore 문서에 base64 로 넣으면 1MiB 문서 한도를 넘긴다. 바이트는
// 비공개 assets 버킷에 두고, 문서에는 /media/... 경로만 저장한다.
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

app.post('/api/stories/photo', writeLimiter, async (req, res) => {
  const { dataUrl } = req.body ?? {};

  if (typeof dataUrl !== 'string') {
    res.status(400).json({ error: 'dataUrl 이 필요합니다.' });
    return;
  }
  if (!CONFIG.ASSETS_BUCKET) {
    res.status(503).json({ error: 'ASSETS_BUCKET 이 설정되지 않았습니다.' });
    return;
  }

  const match = dataUrl.match(/^data:([a-z/+-]+);base64,(.+)$/i);
  if (!match) {
    res.status(400).json({ error: '지원하지 않는 이미지 형식입니다.' });
    return;
  }

  const [, mime, b64] = match;
  const ext = ALLOWED_PHOTO_TYPES[mime.toLowerCase()];
  if (!ext) {
    res.status(400).json({ error: 'JPEG / PNG / WebP 이미지만 첨부할 수 있습니다.' });
    return;
  }

  const bytes = Buffer.from(b64, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) {
    res.status(413).json({ error: '사진 용량이 너무 큽니다 (최대 4MB).' });
    return;
  }

  const objectName = `community/${Date.now()}-${randomUUID()}.${ext}`;

  try {
    await uploadAsset(CONFIG.ASSETS_BUCKET, objectName, bytes, mime);
    // 버킷은 비공개이므로 브라우저는 /media 프록시를 통해서만 읽는다.
    res.status(201).json({ imageUrl: `/media/${objectName}` });
  } catch (err: any) {
    console.error('사진 업로드 실패:', err?.message);
    res.status(500).json({ error: '사진 업로드 중 오류가 발생했습니다.' });
  }
});

// 업로드된 방명록 사진 제공 (비공개 버킷 → 서비스 계정으로 중계)
const MEDIA_PATH = /^community\/[0-9]+-[0-9a-f-]{36}\.(jpg|png|webp)$/;

app.get('/media/*', async (req, res) => {
  const objectName = decodeURIComponent(req.path.slice('/media/'.length));

  if (!MEDIA_PATH.test(objectName) || !CONFIG.ASSETS_BUCKET) {
    res.status(400).json({ error: 'invalid media path' });
    return;
  }

  try {
    const { stream } = openAssetStream(CONFIG.ASSETS_BUCKET, objectName);
    const ext = objectName.split('.').pop();
    res.setHeader('Content-Type', ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    stream.on('error', (err: NodeJS.ErrnoException & { code?: number }) => {
      if (!res.headersSent) res.status(err.code === 404 ? 404 : 502).end();
      else res.destroy();
    });
    stream.pipe(res);
  } catch (err: any) {
    console.error(`[media] ${objectName} 실패:`, err?.message);
    res.status(500).end();
  }
});

// ── GCS 자산 프록시 ─────────────────────────────────────────────────────────
// assets 버킷은 비공개다. 브라우저는 이 라우트를 통해서만 POI 데이터를 받는다.
// 경로 탐색(../)을 막기 위해 허용 패턴을 엄격히 화이트리스트로 검사한다.
const ASSET_PATH = /^v\d+\/(poi-index\.json|poi-cards\.json|poi\/[A-Za-z0-9_-]+\.json)$/;

app.get('/data/*', async (req, res) => {
  // req.params 의 와일드카드 타입은 express 4/5 가 다르므로 경로에서 직접 떼어낸다.
  const objectName = decodeURIComponent(req.path.slice('/data/'.length));

  if (!ASSET_PATH.test(objectName)) {
    res.status(400).json({ error: 'invalid asset path' });
    return;
  }

  // 로컬 개발: ASSETS_BUCKET 이 없으면 build/gcs/assets 를 그대로 서빙한다.
  // 덕분에 프론트는 개발에서도 프로덕션과 똑같이 /data/* 만 바라보면 되고,
  // POI 데이터를 번들에 넣을 이유가 사라진다.
  if (!CONFIG.ASSETS_BUCKET) {
    const localFile = path.resolve(process.cwd(), '../build/gcs/assets', objectName);
    if (fs.existsSync(localFile)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(localFile);
    } else {
      res.status(503).json({
        error: 'ASSETS_BUCKET 미설정, 로컬 산출물도 없음. `npm run build:data` 를 실행하세요.'
      });
    }
    return;
  }

  try {
    const { stream } = openAssetStream(CONFIG.ASSETS_BUCKET, objectName);

    // 버전 프리픽스로 격리된 불변 객체이므로 브라우저가 영구 캐시하게 둔다.
    // 객체는 GCS 에 gzip 으로 저장돼 있고, 풀었다 다시 압축하지 않고 그대로 통과시킨다.
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    stream.on('error', (err: NodeJS.ErrnoException & { code?: number }) => {
      const notFound = err.code === 404;
      if (!notFound) console.error(`[asset] ${objectName} 스트림 실패:`, err.message);
      if (!res.headersSent) res.status(notFound ? 404 : 502).end();
      else res.destroy();
    });

    stream.pipe(res);
  } catch (err: any) {
    console.error(`[asset] ${objectName} 실패:`, err?.message);
    res.status(500).json({ error: 'asset fetch failed' });
  }
});

// ── SSE: 2-Layer 에이전트 도슨트 스토리 ─────────────────────────────────────
function openSSE(res: express.Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // 중간 프록시가 응답을 모아서 보내지 않도록 명시 (스트리밍이 끊겨 보이는 것 방지)
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

app.post('/api/agent/stream-story', async (req, res) => {
  openSSE(res);

  const { poiName, characterId, userQuery, coordinates } = req.body;
  if (!poiName || !characterId) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'poiName and characterId are required' })}\n\n`);
    res.end();
    return;
  }

  await AgentOrchestrator.orchestrateStoryStream({ poiName, characterId, userQuery, coordinates }, res);
});

app.post('/api/agent/stream-chat', async (req, res) => {
  openSSE(res);

  const { poiName, characterId, userMessage, history } = req.body;
  if (!poiName || !characterId || !userMessage) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'poiName, characterId, and userMessage are required' })}\n\n`);
    res.end();
    return;
  }

  await AgentOrchestrator.orchestrateChatStream({ poiName, characterId, userMessage, history }, res);
});

// ── 정적 프론트엔드 (프로덕션 단일 서비스) ──────────────────────────────────
const STATIC_DIR = process.env.STATIC_DIR || path.resolve(__dirname, '../../dist');

if (fs.existsSync(STATIC_DIR)) {
  // 해시가 붙은 자산은 영구 캐시, index.html 은 항상 재검증해야 새 배포가 즉시 반영된다.
  app.use(
    express.static(STATIC_DIR, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
        else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    })
  );

  // SPA fallback — API/자산 경로가 아닌 나머지는 index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/data/') || req.path.startsWith('/media/')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

// ── 기동: 데이터 적재를 끝낸 뒤에 리스닝 ────────────────────────────────────
// Cloud Run 은 포트가 열리는 순간 트래픽을 보낸다. 코퍼스 적재 전에 listen 하면
// 첫 요청이 빈 코퍼스로 처리되므로 순서를 반드시 지킨다.
async function start() {
  const started = Date.now();

  const [corpusDocs, spatialPOIs] = await Promise.all([
    initArchiveCorpus().catch((e) => {
      console.error('❌ 코퍼스 적재 실패:', e.message);
      return 0;
    }),
    initSpatialPOIs().catch((e) => {
      console.error('❌ POI 적재 실패:', e.message);
      return 0;
    })
  ]);

  // 방명록 시드. 문서 ID 가 고정이라 재시작해도 중복 생성되지 않고,
  // 이미 있는 글은 건드리지 않아 사용자가 누른 공감 수가 보존된다.
  try {
    const seeded = await communityStoryService.seedIfEmpty();
    if (seeded > 0) console.log(`🌱 방명록 시드 ${seeded}건 적재`);
  } catch (e: any) {
    console.error('❌ 방명록 시드 실패:', e.message);
  }

  if (corpusDocs === 0) {
    console.error('❌ 코퍼스가 비어 있습니다. CORPUS_URI 를 확인하세요. RAG 없이 기동합니다.');
  }

  app.listen(CONFIG.PORT, () => {
    console.log(`🚀 [Docent Backend] :${CONFIG.PORT} (기동 ${Date.now() - started}ms)`);
    console.log(`📚 코퍼스 ${corpusDocs}건 · POI ${spatialPOIs}건`);
    console.log(`🤖 모델 ${CONFIG.GEMINI_MODEL} · API 키 ${CONFIG.GEMINI_API_KEY ? '설정됨' : '없음'}`);
    console.log(`🗂  정적 ${fs.existsSync(STATIC_DIR) ? STATIC_DIR : '(없음, API 전용)'}`);
  });
}

start();
