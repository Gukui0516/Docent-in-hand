import { POI, POICard, POIDetail, POISummary } from '../types/docent';
import { deepDecodeHtmlEntities } from '../utils/text';

/**
 * POI 데이터 접근 계층.
 *
 * 예전에는 poiData.ts(10MB) + ragKnowledgeBase.ts(10MB) + ragFullCorpus.json(20MB)이
 * 번들에 그대로 인라인돼 초기 다운로드가 gzip 7.7MB였다. 이제 세 단계로 나눠
 * 필요한 시점에만 가져온다.
 *
 *   poi-index.json   부팅 시 1회        gzip  62KB   검색·필터·최근접 탐색
 *   poi-cards.json   탐색 시트 첫 오픈   gzip 329KB   카드 썸네일 + 요약
 *   poi/{id}.json    POI 선택 시 1건    최대   7KB   상세 + 학술 문서
 *
 * 요청은 동일 오리진 /data/* 로 나가고, Cloud Run 이 비공개 GCS 버킷에서 중계한다.
 * 응답에 immutable 캐시 헤더가 붙어 있어 재요청은 브라우저 캐시에서 끝난다.
 *
 * ⚠️ 이 파일에서 src/data/poiData.ts 를 import 하지 말 것.
 *    .catch() 안에 있더라도 정적 import 는 트리셰이킹되지 않아 10MB 가 번들에
 *    다시 들어오고, 위 분할이 통째로 무의미해진다. 로컬 개발용 폴백은 백엔드
 *    /data/* 라우트가 build/gcs/assets 를 서빙하는 방식으로 이미 처리돼 있다.
 */

const DATA_VERSION = import.meta.env.VITE_DATA_VERSION || 'v1';
const BASE = `/data/${DATA_VERSION}`;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} 요청 실패 (HTTP ${res.status})`);
  const raw = await res.json();
  return deepDecodeHtmlEntities(raw) as T;
}

// 같은 리소스를 동시에 여러 번 요청해도 네트워크 호출은 1회가 되도록 Promise 를 캐시한다.
let indexPromise: Promise<POISummary[]> | null = null;
let cardsPromise: Promise<Record<string, POICard>> | null = null;
const detailPromises = new Map<string, Promise<POIDetail>>();

// 이미 도착한 인덱스를 동기로 참조해야 하는 곳(레거시 데이터 보강 등)을 위한 캐시.
// 아직 로드 전이면 빈 배열을 돌려주므로 호출부는 폴백을 갖고 있어야 한다.
let loadedIndex: POISummary[] = [];

export function getLoadedPOIIndex(): POISummary[] {
  return loadedIndex;
}

export function loadPOIIndex(): Promise<POISummary[]> {
  return (indexPromise ??= fetchJson<POISummary[]>(`${BASE}/poi-index.json`)
    .then((idx) => {
      loadedIndex = idx;
      return idx;
    })
    .catch((err) => {
    // 실패한 Promise 를 캐시에 남기면 재시도가 영구히 막힌다.
    indexPromise = null;
    throw err;
  }));
}

export function loadPOICards(): Promise<Record<string, POICard>> {
  return (cardsPromise ??= fetchJson<Record<string, POICard>>(`${BASE}/poi-cards.json`).catch((err) => {
    cardsPromise = null;
    throw err;
  }));
}

export function loadPOIDetail(id: string): Promise<POIDetail> {
  let pending = detailPromises.get(id);
  if (!pending) {
    pending = fetchJson<POIDetail>(`${BASE}/poi/${encodeURIComponent(id)}.json`).catch((err) => {
      detailPromises.delete(id);
      throw err;
    });
    detailPromises.set(id, pending);
  }
  return pending;
}

/** 요약 + 상세를 합쳐 화면이 쓰는 완전한 POI 를 만든다. */
export async function resolvePOI(summary: POISummary): Promise<POI> {
  const detail = await loadPOIDetail(summary.id);
  return { ...summary, ...detail, id: summary.id };
}

/**
 * 상세를 아직 못 받았을 때 쓰는 자리표시자. 상세 fetch 가 끝나면 교체된다.
 * 화면이 POI 를 항상 non-null 로 다룰 수 있어 분기가 줄어든다.
 */
export function placeholderPOI(summary: POISummary): POI {
  return {
    ...summary,
    imageUrl: '',
    images: [],
    imageTitle: '',
    imageSource: '',
    sourceUrl: undefined,
    mythAndFact: { summary: '', details: '' },
    sampleQuestions: [],
    ragDocument: null
  };
}
