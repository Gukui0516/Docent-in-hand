import { POI, RAGDocument } from '../types/docent';

/**
 * Generates an engaging, context-tailored theme title for POI stories
 * e.g., "오백장군에 깃든 이야기", "만장굴의 역사와 탐라의 숨결", "용두암에 깃든 전설"
 */
export const getThemeTitle = (poi: POI, ragDoc?: RAGDocument | null): string => {
  if (!poi) return '제주 이야기';

  const poiName = poi.name ? poi.name.trim() : '';

  // Specific folklore narrative title if valid and clean
  if (
    ragDoc?.folkloreNarrative?.title &&
    !ragDoc.folkloreNarrative.title.includes('구전 설화 및 유래') &&
    !ragDoc.folkloreNarrative.title.includes('기본정보') &&
    ragDoc.folkloreNarrative.title.length < 30
  ) {
    return ragDoc.folkloreNarrative.title;
  }

  // Landmark & myth keyword matching for rich engaging titles
  if (poiName.includes('오백장군')) return '오백장군에 깃든 이야기';
  if (poiName.includes('만장굴')) return '만장굴의 역사와 탐라의 숨결';
  if (poiName.includes('용두암') || poiName.includes('용연')) return `${poiName}에 깃든 전설과 이야기`;
  if (poiName.includes('해녀')) return `${poiName}에 스며든 바다와 삶의 이야기`;
  if (poiName.includes('목관아') || poiName.includes('관아')) return `${poiName}의 역사와 선조의 숨결`;
  if (poiName.includes('돌하르방')) return `${poiName}이 지켜온 오랜 역사`;
  if (poiName.includes('설문대')) return `${poiName}의 태고 신화`;
  if (poiName.includes('성산일출봉') || poiName.includes('일출봉')) return `${poiName}에 깃든 일출과 태고의 전설`;
  if (poiName.includes('백록담') || poiName.includes('한라산')) return `${poiName}의 영산 이야기`;
  if (poiName.includes('사려니')) return `${poiName} 숲길에 깃든 이야기`;
  if (poiName.includes('새별')) return `${poiName} 오름에 깃든 이야기`;

  // Category-based theme title generation
  const category = poi.category || ragDoc?.category || '';

  if (category.includes('역사') || category.includes('인물')) {
    return `${poiName}의 역사와 이야기`;
  }
  if (category.includes('문화유산')) {
    return `${poiName}의 문화유산과 역사`;
  }
  if (category.includes('생활') || category.includes('민속')) {
    return `${poiName}에 깃든 민속 이야기`;
  }
  if (category.includes('자연') || category.includes('지리')) {
    return `${poiName}에 깃든 이야기`;
  }
  if (category.includes('문화') || category.includes('예술')) {
    return `${poiName}에 꽃핀 문화 이야기`;
  }

  return `${poiName}에 깃든 이야기`;
};
