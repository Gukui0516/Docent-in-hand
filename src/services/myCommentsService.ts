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
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
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
  }

  public static clearComments(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear my comments:', e);
    }
  }
}
