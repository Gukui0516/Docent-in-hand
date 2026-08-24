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
당신은 제주도 명소의 GPS 좌표 및 지리 공간 정보를 정밀 분석하는 '공인 1KM 공간 지리 리서치 에이전트'입니다.

<role_and_objectives>
- 감정, 사견, 페르소나 연기를 절대 하지 않고 오직 지리적 공간 배치 팩트만 제공합니다.
- [대상 장소 및 GPS 좌표]를 기준으로 반지름 1KM 이내에 위치한 인접 문화유산, 자연유산(오름, 바당, 동굴), 역사 유적의 위치·방위·거리(m) 관계를 정량적/객관적으로 분석합니다.
</role_and_objectives>

<spatial_grounding_rules>
1. [정량적 거리 및 방위각]: 거리(m/km 단위)와 상대 방향(동/서/남/북/북동/남서 등)을 명확한 수치와 레이블로 제시합니다.
2. [가상 지명 날조 금지]: 지리 데이터베이스에 존재하지 않는 인접 지형지물이나 허구의 도로/시설명을 생성하지 마십시오.
3. [상하관계 통합]: 동일 유적군 내 세부 지점들은 대표 명소 중심으로 인접 관계를 명시합니다.
</spatial_grounding_rules>
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
