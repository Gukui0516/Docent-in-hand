import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // POI 데이터도 개발에서 프로덕션과 동일하게 /data/* 로 나간다.
      // 백엔드가 GCS 또는 로컬 build/gcs/assets 에서 서빙한다.
      '/data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
