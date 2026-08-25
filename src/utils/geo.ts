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
  pois: POISummary[],
  category?: string
): NearestPOIResult | null {
  // 개별 위치를 특정하지 못해 시 중심점으로 떨어진 POI 는 최근접 후보에서 뺀다.
  // 넣어두면 시청 좌표가 항상 "가장 가까운 명소"로 뽑히는 일이 생긴다.
  const located = pois.filter((poi) => poi.hasPreciseLocation !== false);

  const candidates = category
    ? located.filter((poi) => poi.category === category)
    : located;

  if (candidates.length === 0) return null;

  let nearestPOI = candidates[0];
  let minDistance = Infinity;

  for (const poi of candidates) {
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
 * (with specific road name, lot number, building or bracketed address)
 * rather than a generic administrative or broad island/city/dong label.
 */
export function hasClearAddress(region?: string | null): boolean {
  if (!region || typeof region !== 'string') return false;
  const trimmed = region.trim();
  if (!trimmed) return false;

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

  // A clear, concrete address must have specific lot number, road number, building, or bracket notation
  const hasSpecificNumberOrStreet = /\d+번지|\d+호|\d+길|\d+로|\d+-\d+|\d+/.test(trimmed);
  const hasBracketAddress = /\[.*\]/.test(trimmed);
  const hasSpecificSiteMarker = /(입구|주차장|매표소|맞은편|부근|일원)/.test(trimmed);

  return hasSpecificNumberOrStreet || hasBracketAddress || hasSpecificSiteMarker;
}

