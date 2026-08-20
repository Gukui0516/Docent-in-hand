import React from 'react';
import { POI } from '../types/docent';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { ChevronLeft, ChevronRight, MapPin, Compass } from 'lucide-react';
import './NearbyNavSection.css';

interface NearbyNavSectionProps {
  currentPOI: POI;
  allPOIs: POI[];
  userLocation: { lat: number; lng: number };
  onSelectPOI: (poi: POI, distMeters?: number) => void;
}

export const NearbyNavSection: React.FC<NearbyNavSectionProps> = ({
  currentPOI,
  allPOIs,
  userLocation,
  onSelectPOI,
}) => {
  // 1. Calculate distance from user location for all POIs
  const poisWithDist = allPOIs.map((poi) => {
    const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, poi.latitude, poi.longitude);
    return { poi, dist };
  });

  // Sort by nearest distance first
  poisWithDist.sort((a, b) => a.dist - b.dist);

  // 2. Filter POIs within 1KM (1,000m)
  let nearbyItems = poisWithDist.filter((item) => item.dist <= 1000);

  // Fallback if 1km radius has fewer than 2 POIs: pick top 10 nearest POIs
  const isStrict1km = nearbyItems.length >= 2;
  if (!isStrict1km) {
    nearbyItems = poisWithDist.slice(0, 10);
  }

  // Find index of current POI in nearby items list
  let currentIndex = nearbyItems.findIndex((item) => item.poi.id === currentPOI.id);

  // If current POI is not in the list, insert at top
  if (currentIndex === -1) {
    const currentDist = calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      currentPOI.latitude,
      currentPOI.longitude
    );
    nearbyItems.unshift({ poi: currentPOI, dist: currentDist });
    currentIndex = 0;
  }

  const currentItem = nearbyItems[currentIndex];
  const totalCount = nearbyItems.length;

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + totalCount) % totalCount;
    const prevItem = nearbyItems[prevIdx];
    onSelectPOI(prevItem.poi, prevItem.dist);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % totalCount;
    const nextItem = nearbyItems[nextIdx];
    onSelectPOI(nextItem.poi, nextItem.dist);
  };

  return (
    <section className="nearby-nav-section" aria-label="1KM 반경 주변 명소 탐색">
      <div className="nearby-nav-header">
        <div className="nearby-title-badge">
          <Compass size={14} className="compass-icon" />
          <span>{isStrict1km ? '📍 반경 1KM 내 주변 명소 탐색' : '📍 가깝게 이어진 주변 명소'}</span>
          <span className="nearby-count-pill">
            {currentIndex + 1} / {totalCount}
          </span>
        </div>
      </div>

      <div className="nearby-nav-controls">
        <button
          type="button"
          className="nearby-btn prev-btn"
          onClick={handlePrev}
          title="이전 명소 탐색"
          aria-label="이전 명소 탐색"
        >
          <ChevronLeft size={20} />
          <span className="btn-text">이전 명소</span>
        </button>

        <div
          className="nearby-current-info"
          onClick={() => onSelectPOI(currentItem.poi, currentItem.dist)}
          title="명소 상세보기"
        >
          <div className="nearby-poi-name">
            <MapPin size={14} className="pin-icon" />
            <span>{currentPOI.name}</span>
          </div>
          <div className="nearby-poi-meta">
            <span className="nearby-dist">{formatDistance(currentItem.dist)} 앞</span>
            <span className="nearby-cat">• {currentPOI.category}</span>
          </div>
        </div>

        <button
          type="button"
          className="nearby-btn next-btn"
          onClick={handleNext}
          title="다음 명소 탐색"
          aria-label="다음 명소 탐색"
        >
          <span className="btn-text">다음 명소</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
};
