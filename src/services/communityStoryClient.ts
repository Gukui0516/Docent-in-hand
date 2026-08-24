import { UserCommunityStory, INITIAL_COMMUNITY_STORIES } from '../data/communityStories';

export interface CreateStoryPayload {
  poiId: string;
  authorName: string;
  authorType?: UserCommunityStory['authorType'];
  category?: UserCommunityStory['category'];
  content: string;
  imageUrl?: string;
}

/**
 * 사진을 캔버스로 축소한 뒤 data URL 로 돌려준다.
 *
 * 원본 폰 사진(3~5MB)을 그대로 base64 로 보내면 4~7MB 가 되어 서버 본문 한도에
 * 걸리고, Firestore 문서 1MiB 한도도 넘는다. 표시 크기가 카드 폭이라 긴 변
 * 1280px 면 충분하다 — 보통 300KB 안쪽으로 떨어진다.
 */
export async function downscaleImage(file: File, maxEdge = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스를 초기화하지 못했습니다.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // PNG 투명도는 잃지만 사진 첨부 용도라 JPEG 가 용량 면에서 유리하다.
  return canvas.toDataURL('image/jpeg', quality);
}

export class CommunityStoryClient {
  /**
   * 축소한 사진을 서버에 올리고 저장 경로(/media/...)를 받는다.
   * 실패하면 null 을 돌려주고, 호출부는 사진 없이 글만 등록한다.
   */
  static async uploadPhoto(dataUrl: string): Promise<string | null> {
    try {
      const res = await fetch('/api/stories/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl })
      });
      if (res.ok) {
        const data = await res.json();
        return typeof data.imageUrl === 'string' ? data.imageUrl : null;
      }
      console.warn('⚠️ [CommunityStoryClient] 사진 업로드 실패:', res.status);
    } catch (e) {
      console.warn('⚠️ [CommunityStoryClient] 사진 업로드 오류:', e);
    }
    return null;
  }

  /**
   * Fetch all community stories for a specific POI from the central server.
   * Fallback to localStorage and initial seed stories if offline/server error.
   */
  static async fetchStoriesByPOI(poiId: string): Promise<UserCommunityStory[]> {
    try {
      const res = await fetch(`/api/stories?poiId=${encodeURIComponent(poiId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stories)) {
          return data.stories;
        }
      }
    } catch (e) {
      console.warn('⚠️ [CommunityStoryClient] 백엔드 스토리 조회 실패, 로컬 캐시 폴백:', e);
    }

    // Fallback: localStorage + INITIAL_COMMUNITY_STORIES
    const savedCustomStories: UserCommunityStory[] = JSON.parse(
      localStorage.getItem('docent_community_stories') || '[]'
    );
    const allStories = [...savedCustomStories, ...INITIAL_COMMUNITY_STORIES];
    return allStories.filter((s) => s.poiId === poiId);
  }

  /**
   * Submit a new user community story to the central backend server.
   */
  static async submitStory(payload: CreateStoryPayload): Promise<UserCommunityStory> {
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdStory: UserCommunityStory = await res.json();
        return createdStory;
      }
    } catch (e) {
      console.warn('⚠️ [CommunityStoryClient] 백엔드 스토리 등록 실패, 로컬 저장소에 보관:', e);
    }

    // Fallback: LocalStorage
    const fallbackStory: UserCommunityStory = {
      id: `user-story-${Date.now()}`,
      poiId: payload.poiId,
      authorName: payload.authorName || '제주 이웃',
      authorType: payload.authorType || '우리 동네 주민',
      category: payload.category || '옛날 이야기/전설',
      content: payload.content.trim(),
      imageUrl: payload.imageUrl,
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      likes: 0
    };

    const saved: UserCommunityStory[] = JSON.parse(
      localStorage.getItem('docent_community_stories') || '[]'
    );
    localStorage.setItem('docent_community_stories', JSON.stringify([fallbackStory, ...saved]));

    return fallbackStory;
  }

  /**
   * Toggle like for a story on the server.
   */
  static async toggleLike(storyId: string, isLike: boolean): Promise<number | null> {
    try {
      const res = await fetch(`/api/stories/${encodeURIComponent(storyId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLike })
      });

      if (res.ok) {
        const data = await res.json();
        return typeof data.likes === 'number' ? data.likes : null;
      }
    } catch (e) {
      console.warn('⚠️ [CommunityStoryClient] 공감 동기화 실패:', e);
    }
    return null;
  }
}
