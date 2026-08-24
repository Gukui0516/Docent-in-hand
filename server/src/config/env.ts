import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or root directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const CONFIG = {
  // Cloud Run 은 PORT 를 주입한다(8080). 로컬 개발은 Vite 프록시 대상인 3001.
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-3.7-flash',

  // 관리자 기능(방명록 전체 삭제) 토큰. Secret Manager 에서 주입된다.
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',

  // 비공개 assets 버킷 — /data/* 프록시가 서비스 계정으로 읽는다.
  ASSETS_BUCKET: process.env.ASSETS_BUCKET || '',
  DATA_VERSION: process.env.DATA_VERSION || 'v1',
};

if (!CONFIG.GEMINI_API_KEY) {
  console.warn('⚠️ [Server Warning] GEMINI_API_KEY is not configured in .env file.');
}
