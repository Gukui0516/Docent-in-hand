import { POI } from '../types/docent';

export interface SavedStoryItem {
  id: string; // POI id
  poiId: string;
  poiName: string;
  thumbnailUrl: string;
  tags: string[];
  region?: string;
  storyText: string;
  themeTitle: string;
  savedAt: number; // timestamp
  dateKey: string; // YYYY-MM-DD
}

export interface DateGroupedStories {
  dateLabel: string; // "오늘 (2026.08.24)", "어제 (2026.08.23)", "2026.08.20"
  dateKey: string;
  items: SavedStoryItem[];
}

const STORAGE_KEY = 'docent_saved_stories_v1';

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const now = new Date();

  const todayKey = formatDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  if (dateKey === todayKey) {
    return `오늘 (${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')})`;
  }
  if (dateKey === yesterdayKey) {
    return `어제 (${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')})`;
  }

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = daysOfWeek[targetDate.getDay()];
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${dayOfWeek})`;
}

export class SavedStoryService {
  public static getSavedStories(): SavedStoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load saved stories from localStorage:', e);
      return [];
    }
  }

  public static isSaved(poiId: string): boolean {
    const list = this.getSavedStories();
    return list.some((item) => item.poiId === poiId);
  }

  public static saveStory(poi: POI, storyText: string, themeTitle: string): SavedStoryItem {
    const list = this.getSavedStories();
    const now = new Date();
    const dateKey = formatDateKey(now);

    const thumbnailUrl =
      (poi.images && poi.images.length > 0 && poi.images[0].src) ||
      poi.imageUrl ||
      'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80';

    const newItem: SavedStoryItem = {
      id: poi.id,
      poiId: poi.id,
      poiName: poi.name,
      thumbnailUrl,
      tags: poi.tags || [],
      region: poi.region,
      storyText: storyText || `${poi.name}에 관한 도슨트 해설입니다.`,
      themeTitle: themeTitle || `${poi.name}의 이야기`,
      savedAt: now.getTime(),
      dateKey
    };

    // Remove existing if already saved to update to newest
    const filtered = list.filter((item) => item.poiId !== poi.id);
    const updated = [newItem, ...filtered];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist saved story:', e);
    }

    return newItem;
  }

  public static removeStory(poiId: string): void {
    const list = this.getSavedStories();
    const updated = list.filter((item) => item.poiId !== poiId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove saved story:', e);
    }
  }

  public static toggleSave(poi: POI, storyText: string, themeTitle: string): boolean {
    if (this.isSaved(poi.id)) {
      this.removeStory(poi.id);
      return false; // Now unsaved
    } else {
      this.saveStory(poi, storyText, themeTitle);
      return true; // Now saved
    }
  }

  public static getGroupedStories(): DateGroupedStories[] {
    const list = this.getSavedStories();
    // Sort newest first
    list.sort((a, b) => b.savedAt - a.savedAt);

    const groupMap: Map<string, SavedStoryItem[]> = new Map();

    for (const item of list) {
      const key = item.dateKey || formatDateKey(new Date(item.savedAt));
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    }

    const result: DateGroupedStories[] = [];
    groupMap.forEach((items, dateKey) => {
      result.push({
        dateKey,
        dateLabel: getDateLabel(dateKey),
        items
      });
    });

    return result;
  }
}
