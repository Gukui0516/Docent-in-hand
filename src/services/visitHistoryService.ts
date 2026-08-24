import { POISummary } from '../types/docent';

export interface VisitRecord {
  id: string;
  name: string;
  category: string;
  region: string;
  imageUrl?: string;
  summary?: string;
  visitedAt: number; // timestamp in ms
}

export interface DateGroupedVisits {
  dateKey: string;
  dateLabel: string;
  records: VisitRecord[];
}

const STORAGE_KEY = 'docent_visit_history';
const MAX_HISTORY_ITEMS = 100;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes window for duplicate consecutive visit

export class VisitHistoryService {
  private static getStorage(): VisitRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to read visit history:', e);
      return [];
    }
  }

  private static setStorage(records: VisitRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_HISTORY_ITEMS)));
    } catch (e) {
      console.warn('Failed to save visit history:', e);
    }
  }

  /**
   * Records a POI visit into history.
   */
  public static recordVisit(
    poi: POISummary,
    imageUrl?: string,
    summary?: string
  ): void {
    if (!poi || !poi.id) return;

    const list = this.getStorage();
    const now = Date.now();

    // If the latest visit is the exact same POI within DEDUP_WINDOW_MS, update its timestamp
    if (list.length > 0 && list[0].id === poi.id && now - list[0].visitedAt < DEDUP_WINDOW_MS) {
      list[0].visitedAt = now;
      if (imageUrl && !list[0].imageUrl) list[0].imageUrl = imageUrl;
      if (summary && !list[0].summary) list[0].summary = summary;
      this.setStorage(list);
      return;
    }

    // Remove older duplicate of this POI if exists to put the latest at the top
    const filtered = list.filter((item) => item.id !== poi.id);

    const newRecord: VisitRecord = {
      id: poi.id,
      name: poi.name,
      category: poi.category,
      region: poi.region,
      imageUrl: imageUrl || '',
      summary: summary || '',
      visitedAt: now
    };

    filtered.unshift(newRecord);
    this.setStorage(filtered);
  }

  /**
   * Retrieves all visit records sorted by latest first.
   */
  public static getVisits(): VisitRecord[] {
    return this.getStorage();
  }

  /**
   * Returns statistics about visits.
   */
  public static getStats(): { totalCount: number; thisMonthCount: number; latestVisit?: VisitRecord } {
    const list = this.getStorage();
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const thisMonthVisits = list.filter((v) => {
      const d = new Date(v.visitedAt);
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });

    return {
      totalCount: list.length,
      thisMonthCount: thisMonthVisits.length,
      latestVisit: list[0] || undefined
    };
  }

  /**
   * Groups visit records by date (오늘, 어제, or 'M월 D일').
   */
  public static getGroupedVisits(): DateGroupedVisits[] {
    const list = this.getStorage();
    if (list.length === 0) return [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const groupsMap = new Map<string, { label: string; records: VisitRecord[] }>();

    for (const record of list) {
      const d = new Date(record.visitedAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let label = `${d.getMonth() + 1}월 ${d.getDate()}일`;
      if (dateKey === todayStr) {
        label = '오늘';
      } else if (dateKey === yesterdayStr) {
        label = '어제';
      }

      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, { label, records: [] });
      }
      groupsMap.get(dateKey)!.records.push(record);
    }

    return Array.from(groupsMap.entries()).map(([dateKey, val]) => ({
      dateKey,
      dateLabel: val.label,
      records: val.records
    }));
  }

  /**
   * Removes a single visit from history.
   */
  public static removeVisit(id: string): void {
    const list = this.getStorage();
    const filtered = list.filter((item) => item.id !== id);
    this.setStorage(filtered);
  }

  /**
   * Clears entire visit history.
   */
  public static clearVisits(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear visit history:', e);
    }
  }
}
