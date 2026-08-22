import { POI } from '../types/docent';
import { RAGDocument } from '../data/ragKnowledgeBase';

/**
 * Generates an engaging, clean theme title for POI stories
 * Format required: "[POI 이름]의 이야기" (e.g., "오룡복 처 김씨의 이야기", "오등동 사지의 이야기")
 */
export const getThemeTitle = (poi: POI, _ragDoc?: RAGDocument): string => {
  if (!poi || !poi.name) return '제주의 이야기';
  return `${poi.name.trim()}의 이야기`;
};
