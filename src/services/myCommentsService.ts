import { getLoadedPOIIndex } from './poiDataService';

export interface MyCommentItem {
  id: string;
  poiId: string;
  poiName: string;
  poiImageUrl?: string;
  authorName: string;
  authorType?: string;
  category?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  timestamp: number;
}

export interface DateGroupedComments {
  dateKey: string;
  dateLabel: string;
  items: MyCommentItem[];
}

const STORAGE_KEY = 'docent_my_comments';

export class MyCommentsService {
  private static getStorage(): MyCommentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      let list: MyCommentItem[] = data ? JSON.parse(data) : [];
      if (!Array.isArray(list)) list = [];

      // Also reconcile with legacy 'docent_community_stories' if any exist
      const legacyStories = localStorage.getItem('docent_community_stories');
      if (legacyStories) {
        try {
          const parsedLegacy = JSON.parse(legacyStories);
          if (Array.isArray(parsedLegacy)) {
            for (const story of parsedLegacy) {
              if (!list.some((item) => item.id === story.id)) {
                // 부팅 시 받아 둔 POI 인덱스에서 이름을 보강한다.
                // 생성 파일(poiData.ts)은 .gitignore 대상이라 import 하면
                // 클린 체크아웃 빌드가 깨진다 (트러블슈팅 TS-015 참조).
                const poi = getLoadedPOIIndex().find((p) => p.id === story.poiId);
                list.push({
                  id: story.id,
                  poiId: story.poiId,
                  poiName: poi ? poi.name : '제주 명소',
                  // 인덱스에는 imageUrl 이 없다(용량 때문에 카드로 분리). 원본 값만 쓴다.
                  poiImageUrl: story.imageUrl,
                  authorName: story.authorName || '다정한 바당',
                  authorType: story.authorType,
                  category: story.category,
                  content: story.content || '',
                  imageUrl: story.imageUrl,
                  createdAt: story.createdAt || '2026.08.24',
                  timestamp: Date.now()
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }

      return list;
    } catch (e) {
      console.warn('Failed to read my comments:', e);
      return [];
    }
  }

  private static setStorage(items: MyCommentItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save my comments:', e);
    }
  }

  public static addMyComment(comment: {
    id: string;
    poiId: string;
    poiName: string;
    poiImageUrl?: string;
    authorName: string;
    authorType?: string;
    category?: string;
    content: string;
    imageUrl?: string;
    createdAt?: string;
  }): void {
    const list = this.getStorage();
    const now = Date.now();
    const dateStr = comment.createdAt || new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const newItem: MyCommentItem = {
      id: comment.id,
      poiId: comment.poiId,
      poiName: comment.poiName,
      poiImageUrl: comment.poiImageUrl,
      authorName: comment.authorName,
      authorType: comment.authorType,
      category: comment.category,
      content: comment.content,
      imageUrl: comment.imageUrl,
      createdAt: dateStr,
      timestamp: now
    };

    // Filter out duplicate ID if already exists
    const filtered = list.filter((item) => item.id !== comment.id);
    filtered.unshift(newItem);
    this.setStorage(filtered);
  }

  public static getMyComments(): MyCommentItem[] {
    return this.getStorage();
  }

  public static getGroupedComments(): DateGroupedComments[] {
    const list = this.getStorage();
    if (list.length === 0) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    const groupsMap = new Map<string, { label: string; items: MyCommentItem[] }>();

    for (const item of list) {
      const dateKey = item.createdAt || todayStr;
      let label = dateKey;
      if (dateKey.replace(/\s/g, '').includes(todayStr.replace(/\s/g, ''))) {
        label = `오늘 (${dateKey})`;
      }

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, { label, items: [] });
      }
      groupsMap.get(dateKey)!.items.push(item);
    }

    return Array.from(groupsMap.entries()).map(([dateKey, val]) => ({
      dateKey,
      dateLabel: val.label,
      items: val.items
    }));
  }

  public static removeComment(commentId: string): void {
    const list = this.getStorage();
    const filtered = list.filter((item) => item.id !== commentId);
    this.setStorage(filtered);

    // Also remove from legacy storage if present
    try {
      const legacyStories = localStorage.getItem('docent_community_stories');
      if (legacyStories) {
        const parsedLegacy = JSON.parse(legacyStories);
        if (Array.isArray(parsedLegacy)) {
          const filteredLegacy = parsedLegacy.filter((s: { id: string }) => s.id !== commentId);
          localStorage.setItem('docent_community_stories', JSON.stringify(filteredLegacy));
        }
      }
    } catch {
      // ignore
    }
  }

  public static clearComments(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('docent_community_stories');
    } catch (e) {
      console.warn('Failed to clear my comments:', e);
    }
  }
}
