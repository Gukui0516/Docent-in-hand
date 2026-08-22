import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config/env.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { initArchiveCorpus, getCorpusSize } from './agents/tools/archiveSearchTool.js';
import { initSpatialPOIs, getSpatialPOICount } from './agents/tools/spatialSearchTool.js';
import { openAssetStream } from './data/gcsSource.js';
import { GROUNDING_TEST_CASES, GroundingEvaluationService } from './services/groundingEvaluationService.js';

const app = express();

// 프로덕션에서는 프론트와 백엔드가 같은 Cloud Run 오리진이라 CORS 가 필요 없다.
// 로컬 개발에서만 Vite dev 서버(5173)를 허용한다.
app.use(cors({ origin: CONFIG.IS_PRODUCTION ? false : ['http://localhost:5173'] }));
app.use(express.json());

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
    if (req.path.startsWith('/api/') || req.path.startsWith('/data/')) return next();
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
