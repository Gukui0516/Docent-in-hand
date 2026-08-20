import fs from 'fs';
import path from 'path';

export interface SpatialPOIItem {
  id: string;
  name: string;
  category: string;
  region: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  formattedDistance: string;
  directionLabel: string;
  tags: string[];
  summary: string;
}

export interface SpatialSearchResult {
  centerPOI: string;
  centerCoordinates: { lat: number; lng: number } | null;
  radiusKm: number;
  nearbyItems: SpatialPOIItem[];
  formattedSpatialContext: string;
}

interface RawPOI {
  id: string;
  name: string;
  category: string;
  region: string;
  latitude: number;
  longitude: number;
  tags: string[];
  mythAndFact?: {
    summary?: string;
  };
}

let KNOWN_POIS: RawPOI[] = [];

// Curated coordinates mapping for famous landmarks
const EXACT_COORDS: Record<string, [number, number]> = {
  '만장굴': [33.5284, 126.7716],
  '용연': [33.5165, 126.5126],
  '용두암': [33.5165, 126.5126],
  '수월봉': [33.2952, 126.1627],
  '사려니': [33.4077, 126.6433],
  '새별': [33.3665, 126.3562],
  '용눈이': [33.4608, 126.8327],
  '다랑쉬': [33.4735, 126.8335],
  '거문 오름': [33.4599, 126.7136],
  '산굼부리': [33.4338, 126.6882],
  '금능': [33.3905, 126.2355],
  '협재': [33.3941, 126.2397],
  '함덕': [33.5434, 126.6692],
  '김녕': [33.5574, 126.7594],
  '월정': [33.5562, 126.7958],
  '곽지': [33.4509, 126.3106],
  '우도': [33.5043, 126.9542],
  '도두봉': [33.5069, 126.4677],
  '성산일출봉': [33.4585, 126.9427],
  '산방산': [33.2366, 126.3134],
  '주상절리': [33.2378, 126.4249],
  '천지연': [33.2448, 126.5595],
  '정방': [33.2449, 126.5719],
  '쇠소깍': [33.2527, 126.6234],
  '섭지코지': [33.4241, 126.9298],
  '외돌개': [33.2403, 126.5458],
  '용머리해안': [33.2324, 126.3148],
  '비자림': [33.4913, 126.8337],
  '한라산': [33.3617, 126.5332]
};

try {
  // Load full POI database from synced JSON corpus or src/data/poiData.ts
  const srcPoiPath = path.resolve(process.cwd(), 'src/data/poiData.ts');
  if (fs.existsSync(srcPoiPath)) {
    const rawCode = fs.readFileSync(srcPoiPath, 'utf-8');
    const jsonMatch = rawCode.match(/export const POI_LIST: POI\[\] = (\[[\s\S]*?\]);/);
    if (jsonMatch && jsonMatch[1]) {
      KNOWN_POIS = JSON.parse(jsonMatch[1]);
    }
  }
} catch (e) {
  console.warn('Could not load POI_LIST for SpatialSearchTool:', e);
}

export class SpatialSearchTool {
  /**
   * Searches for nearby POIs, heritage sites, and natural places within radiusKm (default 1.0 KM)
   */
  public static searchNearby(
    poiName: string,
    centerCoords?: { lat: number; lng: number },
    radiusKm: number = 1.0
  ): SpatialSearchResult {
    // 1. Determine center coordinates
    let lat = centerCoords?.lat;
    let lng = centerCoords?.lng;

    if (!lat || !lng) {
      // Find from KNOWN_POIS or EXACT_COORDS
      const matched = KNOWN_POIS.find((p) => p.name.includes(poiName) || poiName.includes(p.name));
      if (matched) {
        lat = matched.latitude;
        lng = matched.longitude;
      } else {
        for (const [key, coords] of Object.entries(EXACT_COORDS)) {
          if (poiName.includes(key) || key.includes(poiName)) {
            lat = coords[0];
            lng = coords[1];
            break;
          }
        }
      }
    }

    if (!lat || !lng) {
      // Default to Jeju center if unknown
      lat = 33.4996;
      lng = 126.5312;
    }

    const radiusMeters = radiusKm * 1000;
    const nearbyItems: SpatialPOIItem[] = [];

    // 2. Scan KNOWN_POIS and calculate distance + bearing
    for (const poi of KNOWN_POIS) {
      // Skip exact same POI or duplicate name
      if (poi.name === poiName || (poiName.includes(poi.name) && poi.name.length >= poiName.length)) {
        continue;
      }

      const dist = this.calculateDistanceMeters(lat, lng, poi.latitude, poi.longitude);

      // Search within radius (or up to 1.5km if 1km is too sparse)
      if (dist > 0 && dist <= Math.max(radiusMeters, 1500)) {
        const directionLabel = this.calculateDirection(lat, lng, poi.latitude, poi.longitude);
        const formattedDistance = dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`;

        nearbyItems.push({
          id: poi.id,
          name: poi.name,
          category: poi.category || '기타 명소',
          region: poi.region || '제주특별자치도',
          latitude: poi.latitude,
          longitude: poi.longitude,
          distanceMeters: dist,
          formattedDistance,
          directionLabel,
          tags: poi.tags || [],
          summary: poi.mythAndFact?.summary || `${poi.name} 주변 명소`
        });
      }
    }

    // Sort by distance (closest first)
    nearbyItems.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Limit to top 5 most relevant nearby places
    const topNearby = nearbyItems.slice(0, 5);

    // 3. Format clean spatial context text
    const formattedSpatialContext = this.formatSpatialContext(poiName, { lat, lng }, radiusKm, topNearby);

    return {
      centerPOI: poiName,
      centerCoordinates: { lat, lng },
      radiusKm,
      nearbyItems: topNearby,
      formattedSpatialContext
    };
  }

  /**
   * Haversine formula distance calculation in meters
   */
  public static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Calculates compass direction label (e.g. '동쪽', '북서쪽') from p1 to p2
   */
  private static calculateDirection(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaLambda = toRad(lon2 - lon1);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;

    if (bearing >= 337.5 || bearing < 22.5) return '북쪽';
    if (bearing >= 22.5 && bearing < 67.5) return '북동쪽';
    if (bearing >= 67.5 && bearing < 112.5) return '동쪽';
    if (bearing >= 112.5 && bearing < 157.5) return '남동쪽';
    if (bearing >= 157.5 && bearing < 202.5) return '남쪽';
    if (bearing >= 202.5 && bearing < 247.5) return '남서쪽';
    if (bearing >= 247.5 && bearing < 292.5) return '서쪽';
    return '북서쪽';
  }

  private static formatSpatialContext(
    poiName: string,
    coords: { lat: number; lng: number },
    radiusKm: number,
    items: SpatialPOIItem[]
  ): string {
    const lines: string[] = [];
    lines.push(`[📍 주변 1KM 공간 지리 & 인접 문화유산·자연유산 분석]`);
    lines.push(`- 기준 위치: [${poiName}] (위도 ${coords.lat.toFixed(4)}, 경도 ${coords.lng.toFixed(4)})`);
    lines.push(`- 탐색 반경: ${radiusKm}KM 이내`);

    if (items.length === 0) {
      lines.push(`- 공간 지리 팩트: 반경 ${radiusKm}KM 내에 위치한 별도 문화재 및 인접 명소 기록 없음 (독립된 명소 지형).`);
    } else {
      lines.push(`- 인접 명소 및 공간 맥락 (총 ${items.length}곳):`);
      items.forEach((item) => {
        lines.push(
          `  • ${item.directionLabel} ${item.formattedDistance} 지점: [${item.name}] (${item.category}) - ${item.summary.slice(0, 100)}`
        );
      });
    }

    return lines.join('\n');
  }
}
