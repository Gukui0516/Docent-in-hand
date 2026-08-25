import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 카카오 REST API 키를 가져온다.
 *
 * 이 키는 서버용이라 지도 JS 키와 달리 **허용 도메인 제한이 걸리지 않는다.**
 * 유출되면 누구나 우리 쿼터로 API 를 호출할 수 있으므로 저장소에 두지 않는다.
 * (이전에는 스크립트에 하드코딩돼 공개 저장소에 커밋돼 있었다.)
 *
 * 조회 순서:
 *   1. 환경변수 KAKAO_REST_KEY
 *   2. 프로젝트 루트 .env 의 KAKAO_REST_KEY   (.gitignore 대상)
 *   3. Secret Manager 의 kakao-rest-key       (gcloud 로그인 필요)
 */
export function getKakaoRestKey() {
  const fromEnv = process.env.KAKAO_REST_KEY?.trim();
  if (fromEnv) return fromEnv;

  const envPath = path.join(ROOT_DIR, '.env');
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('KAKAO_REST_KEY='));
    const val = line?.slice('KAKAO_REST_KEY='.length).trim().replace(/^["']|["']$/g, '');
    if (val) return val;
  }

  try {
    return execFileSync(
      'gcloud',
      [
        'secrets', 'versions', 'access', 'latest',
        '--secret=kakao-rest-key',
        '--project=iceu-694'
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
  } catch {
    // gcloud 미로그인 등 — 아래 안내로 넘어간다
  }

  throw new Error(
    '카카오 REST 키를 찾지 못했습니다. 다음 중 하나로 제공하세요:\n' +
      '  1) KAKAO_REST_KEY=... 를 .env 에 추가\n' +
      '  2) KAKAO_REST_KEY=... 환경변수로 실행\n' +
      '  3) gcloud auth login 후 Secret Manager(kakao-rest-key) 사용'
  );
}
