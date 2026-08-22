#!/usr/bin/env bash
#
# build/gcs/ 산출물을 GCS 두 버킷에 올린다.
#   assets → Cloud Run 이 서비스 계정으로 읽어 브라우저에 프록시 (비공개 버킷)
#   data   → 백엔드가 기동 시 코퍼스를 로드 (비공개 버킷)
#
# 두 버킷 모두 비공개다. allUsers 바인딩을 추가하지 말 것.
#
# 사용법:  npm run sync:data && npm run build:data && npm run upload:data
#
set -euo pipefail

PROJECT="${GCP_PROJECT:-iceu-694}"
ASSETS_BUCKET="${ASSETS_BUCKET:-docent-in-hand-assets}"
DATA_BUCKET="${DATA_BUCKET:-docent-in-hand-data}"
VERSION="${DATA_VERSION:-v1}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_ASSETS="$ROOT/build/gcs/assets/$VERSION"
SRC_DATA="$ROOT/build/gcs/data"

if [[ ! -d "$SRC_ASSETS" || ! -d "$SRC_DATA" ]]; then
  echo "❌ build/gcs 산출물이 없습니다. 먼저 실행하세요:" >&2
  echo "     npm run build:data" >&2
  exit 1
fi

# 버전 프리픽스로 격리하므로 객체는 영구 불변으로 캐시해도 안전하다.
# 데이터를 갱신할 때는 DATA_VERSION=v2 로 올리고 프론트/백엔드 환경변수만 교체한다.
CACHE_CONTROL="public, max-age=31536000, immutable"

echo "📤 assets → gs://$ASSETS_BUCKET/$VERSION/  (gzip 전송, $(find "$SRC_ASSETS" -type f | wc -l | tr -d ' ')개 객체)"
gcloud storage cp -r -Z \
  --cache-control="$CACHE_CONTROL" \
  --content-type="application/json" \
  --project="$PROJECT" \
  "$SRC_ASSETS" "gs://$ASSETS_BUCKET/"

echo "📤 data   → gs://$DATA_BUCKET/  (corpus + poi-spatial, gzip 전송)"
gcloud storage cp -r -Z \
  --cache-control="$CACHE_CONTROL" \
  --content-type="application/json" \
  --project="$PROJECT" \
  "$SRC_DATA"/* "gs://$DATA_BUCKET/"

echo
echo "✅ 업로드 완료 — Cloud Run 환경변수:"
echo "   CORPUS_URI=gs://$DATA_BUCKET/corpus/$VERSION/ragFullCorpus.json"
echo "   POI_SPATIAL_URI=gs://$DATA_BUCKET/poi/$VERSION/poi-spatial.json"
echo "   ASSETS_BUCKET=$ASSETS_BUCKET"
echo "   DATA_VERSION=$VERSION"
