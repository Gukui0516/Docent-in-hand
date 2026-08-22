# 단일 Cloud Run 서비스: Express 가 API(SSE) + 정적 프론트엔드 + GCS 자산 프록시를 모두 맡는다.
# POI 데이터(40MB)와 코퍼스(19MB)는 이미지에 넣지 않고 런타임에 비공개 GCS 버킷에서 읽는다.

# ── 1. 프론트엔드 빌드 ──────────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public

# npm run build 의 prebuild 훅은 data/ 원본으로 40MB 파일을 생성하는데,
# 이제 그 데이터는 번들이 아니라 GCS 에서 오므로 컴파일·번들만 직접 돌린다.
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
