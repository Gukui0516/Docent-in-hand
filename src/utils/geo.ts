import { POISummary } from '../types/docent';

/**
 * Calculates the great-circle distance between two points in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
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

export interface NearestPOIResult {
  poi: POISummary;
  distanceMeters: number;
  formattedDistance: string;
  isWithinProximity: boolean; // within 3km
}

/**
 * Finds the nearest POI from user's current GPS location.
 *
 * 후보 목록은 인자로 받는다 — 예전에는 10MB POI_LIST 를 직접 import 해서
 * 이 유틸을 쓰는 것만으로 번들이 불어났다. 이제 호출부가 poi-index 를 넘긴다.
 */
export function findNearestPOI(
  userLat: number,
  userLng: number,
  pois: POISummary[]
): NearestPOIResult | null {
  if (pois.length === 0) return null;

  let nearestPOI = pois[0];
  let minDistance = Infinity;

  for (const poi of pois) {
    const dist = calculateDistanceMeters(userLat, userLng, poi.latitude, poi.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPOI = poi;
    }
  }

  const formattedDistance =
    minDistance < 1000 ? `${minDistance}m` : `${(minDistance / 1000).toFixed(1)}km`;

  return {
    poi: nearestPOI,
    distanceMeters: minDistance,
    formattedDistance,
    isWithinProximity: minDistance <= 3000,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Checks whether a given region string is a concrete, specific physical address
 * rather than a generic administrative or broad island/city label.
 */
export function hasClearAddress(region?: string | null): boolean {
  if (!region || typeof region !== 'string') return false;
  const trimmed = region.trim();
  const broadOnly = [
    '제주시',
    '서귀포시',
    '제주특별자치도',
    '제주특별자치도 제주시',
    '제주특별자치도 서귀포시',
    '제주도',
    '제주',
    '서귀포'
  ];
  if (broadOnly.includes(trimmed)) return false;
  return /[읍면동리로길번]/.test(trimmed);
}

