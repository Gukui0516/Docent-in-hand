# 단일 Cloud Run 서비스: Express 가 API(SSE) + 정적 프론트엔드 + GCS 자산 프록시를 모두 맡는다.
# POI 데이터(40MB)와 코퍼스(19MB)는 이미지에 넣지 않고 런타임에 비공개 GCS 버킷에서 읽는다.

# ── 1. 프론트엔드 빌드 ──────────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

# 카카오맵 JS 키는 import.meta.env 로 읽히는 빌드 타임 변수다. Vite 가 번들에
# 인라인하므로 Cloud Run 런타임 환경변수로는 절대 주입되지 않는다.
# 값은 Cloud Build 가 Secret Manager(kakao-map-key)에서 꺼내 --build-arg 로 넘긴다.
# (브라우저 SDK 키라 번들 노출은 정상이며, 보호는 카카오 콘솔의 허용 도메인으로 한다.)
ARG VITE_KAKAO_MAP_API_KEY=""
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY

# 데이터 파이프라인은 빌드 안에서 돌리지 않는다.
# 원본 data/(64MB)는 .gitignore 대상이라 저장소에 없고, .gcloudignore·.dockerignore
# 로도 제외돼 빌드 컨텍스트에 존재할 수 없다. 데이터 갱신은 로컬에서
#   npm run sync:data && npm run build:data && npm run upload:data
# 로 GCS 에 올리고, 런타임에 DATA_VERSION 환경변수로 가리킨다.
RUN npx tsc && npx vite build

# ── 2. 백엔드 빌드 ──────────────────────────────────────────────────────────
FROM node:20-alpine AS backend
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ── 3. 런타임 ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend /app/server/dist ./dist
# STATIC_DIR 기본값이 __dirname/../../dist 이므로 /app/dist 에 놓는다.
COPY --from=frontend /app/dist /app/dist

USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
