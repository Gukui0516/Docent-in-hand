/**
 * text.ts
 *
 * 공공데이터(한국학중앙연구원 한국향토문화전자대전, 구비문학대계, 방언사전 등),
 * GCS 캐시, 외부 API 등에서 유입될 수 있는 HTML 엔티티(&#183;, &middot;, &quot;, &amp; 등)
 * 및 깨진 유니코드 문자열, 잔여 HTML 태그를 검증된 표준 한글/문장부호로 변환합니다.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
  bull: '•',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  tilde: '~'
};

const ENTITY_REGEX = /&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/g;

/**
 * HTML 엔티티를 검증된 표준 유니코드 문자로 디코딩합니다.
 * (예: "4&#183;3문화예술제" -> "4·3문화예술제", "용연&middot;용두암" -> "용연·용두암")
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  if (!text.includes('&')) {
    // Non-breaking space Unicode cleanup
    return text.replace(/\u00a0/g, ' ');
  }

  return text
    .replace(ENTITY_REGEX, (whole, body: string) => {
      if (body[0] === '#') {
        const code =
          body[1] === 'x' || body[1] === 'X'
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);

        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) {
          return whole;
        }

        // &#160; / &#183; / &#8231; 등 특수 치환
        if (code === 160) return ' ';
        if (code === 183 || code === 8231) return '·';
        if (code === 8226) return '•';

        return String.fromCodePoint(code);
      }

      const lower = body.toLowerCase();
      if (NAMED_ENTITIES[lower] !== undefined) {
        return NAMED_ENTITIES[lower];
      }

      return whole;
    })
    .replace(/\u00a0/g, ' ');
}

/**
 * 텍스트 내 잔여 HTML 태그를 제거하고 깨끗한 텍스트만 추출합니다.
 */
export function stripHtmlTags(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return decodeHtmlEntities(text.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * 객체, 배열 또는 원시값 내부의 모든 문자열을 재귀적으로 디코딩 및 정제합니다.
 */
export function deepDecodeHtmlEntities<T>(obj: T): T {
  if (typeof obj === 'string') {
    return decodeHtmlEntities(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepDecodeHtmlEntities(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      res[decodeHtmlEntities(k)] = deepDecodeHtmlEntities(v);
    }
    return res as T;
  }
  return obj;
}
