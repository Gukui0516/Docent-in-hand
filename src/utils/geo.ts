import { POI } from '../types/docent';
import { POI_LIST } from '../data/poiData';

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
  poi: POI;
  distanceMeters: number;
  formattedDistance: string;
  isWithinProximity: boolean; // within 3km
}

/**
 * Finds the nearest POI from user's current GPS location.
 */
export function findNearestPOI(userLat: number, userLng: number): NearestPOIResult {
  let nearestPOI = POI_LIST[0];
  let minDistance = Infinity;

  for (const poi of POI_LIST) {
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
