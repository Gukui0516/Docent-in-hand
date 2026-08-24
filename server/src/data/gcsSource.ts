import fs from 'fs';
import path from 'path';
import { Storage } from '@google-cloud/storage';

/**
 * 대용량 데이터(코퍼스 19MB, POI 1.5MB)는 컨테이너 이미지가 아니라 비공개 GCS
 * 버킷에 둔다. Cloud Run 에서는 런타임 서비스 계정(ADC)으로 읽고, 로컬 개발에서는
 * URI 를 비워두면 기존 로컬 파일을 그대로 쓴다.
 */

let storage: Storage | null = null;
const client = () => (storage ??= new Storage());

export function parseGsUri(uri: string): { bucket: string; name: string } {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!match) throw new Error(`gs:// URI 형식이 아닙니다: ${uri}`);
  return { bucket: match[1], name: match[2] };
}

/**
 * gs:// URI 에서 JSON 을 읽는다.
 *
 * 객체는 Content-Encoding: gzip 으로 저장돼 있고 SDK 가 다운로드 시 자동으로
 * 해제한다. uri 가 비어 있으면 localFallbacks 를 순서대로 시도한다.
 */
export async function loadJson<T>(
  uri: string | undefined,
  localFallbacks: string[],
  label: string
): Promise<T | null> {
  if (uri) {
    const { bucket, name } = parseGsUri(uri);
    const started = Date.now();
    const [buf] = await client().bucket(bucket).file(name).download();
    const parsed = JSON.parse(buf.toString('utf-8')) as T;
    console.log(
      `📥 [${label}] GCS 로드 완료 ${uri} (${(buf.length / 1048576).toFixed(1)}MB, ${Date.now() - started}ms)`
    );
    return parsed;
  }

  for (const candidate of localFallbacks) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) {
      const parsed = JSON.parse(fs.readFileSync(resolved, 'utf-8')) as T;
      console.log(`📁 [${label}] 로컬 파일 로드 ${candidate}`);
      return parsed;
    }
  }

  console.warn(`⚠️  [${label}] 데이터 소스를 찾지 못했습니다 (URI 미설정 + 로컬 파일 없음).`);
  return null;
}

/**
 * assets 버킷의 객체를 gzip 인 채로 읽어 Express 응답으로 흘려보낸다.
 * 서버에서 압축을 풀었다 다시 압축하지 않도록 decompress:false 로 통과시키고
 * Content-Encoding 을 그대로 전달한다.
 */
export function openAssetStream(bucket: string, name: string) {
  const file = client().bucket(bucket).file(name);
  return {
    file,
    stream: file.createReadStream({ decompress: false })
  };
}

/**
 * 방명록 사진처럼 사용자가 올린 바이트를 비공개 버킷에 저장한다.
 * 버킷이 공개가 아니므로 브라우저는 /media 프록시로만 다시 읽을 수 있다.
 */
export async function uploadAsset(
  bucket: string,
  name: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await client()
    .bucket(bucket)
    .file(name)
    .save(body, {
      contentType,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' }
    });
}
