import { SpatialSearchTool, SpatialSearchResult } from './tools/spatialSearchTool.js';

export interface SpatialBriefingNote {
  targetPOI: string;
  centerCoordinates: { lat: number; lng: number } | null;
  nearbyItems: {
    name: string;
    category: string;
    distanceMeters: number;
    formattedDistance: string;
    directionLabel: string;
    summary: string;
  }[];
  spatialFormattedContext: string;
}

export class SpatialResearchAgent {
  public static readonly SYSTEM_PROMPT = `
당신은 제주도 명소의 GPS 좌표 및 지리 공간 정보를 전문적으로 분석하는 '공인 1KM 공간 지리 리서치 에이전트(SpatialResearchAgent)'입니다.

[역할과 원칙]:
1. 감정, 사견, 페르소나 연기를 절대 하지 마십시오.
2. 당신의 유일한 목표는 [대상 장소 및 GPS 좌표]를 기준으로 반지름 1KM 이내에 위치한 인접 문화유산, 자연유산(오름, 바당, 동굴), 역사 유적, 주요 장소의 위치·방위·거리(m) 관계를 객관적으로 분석하여 공간 맥락을 제공하는 것입니다.
3. 거리(m/km) 및 방향(동/서/남/북/북동/북서 등)을 명확하게 명시하십시오.
4. 중복되거나 상하관계에 있는 항목은 대표 장소 중심으로 정리하고, 불확실한 내용은 "기록 없음"으로 명시하십시오.
`;

  /**
   * Conducts spatial distance and geospatial analysis for the target POI within 1KM radius.
   */
  public static async conductSpatialResearch(
    poiName: string,
    coordinates?: { lat: number; lng: number },
    onStatus?: (statusMessage: string) => void
  ): Promise<SpatialBriefingNote> {
    if (onStatus) {
      onStatus(`📍 [공간 분석 에이전트] [${poiName}] 기준 1KM 반경 내 인접 문화유산·자연지리 탐색 중...`);
    }

    const spatialResult: SpatialSearchResult = SpatialSearchTool.searchNearby(poiName, coordinates, 1.0);

    const nearbyItems = spatialResult.nearbyItems.map((item) => ({
      name: item.name,
      category: item.category,
      distanceMeters: item.distanceMeters,
      formattedDistance: item.formattedDistance,
      directionLabel: item.directionLabel,
      summary: item.summary
    }));

    if (onStatus) {
      onStatus(`✅ 공간 분석 완료: 반경 1KM 내 인접 유산·명소 ${nearbyItems.length}곳 배치 확인`);
    }

    return {
      targetPOI: poiName,
      centerCoordinates: spatialResult.centerCoordinates,
      nearbyItems,
      spatialFormattedContext: spatialResult.formattedSpatialContext
    };
  }
}
