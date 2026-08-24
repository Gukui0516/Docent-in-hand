import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { POISummary } from '../types/docent';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { kakaoMapService } from '../services/kakaoMapService';
import {
  Crosshair,
  Layers,
  Plus,
  Minus
} from 'lucide-react';

interface KakaoPOIMapProps {
  userLocation: { lat: number; lng: number };
  pois: POISummary[];
  selectedCategory: string; // 'all' or category name
  highlightedPOIId?: string;
  onHighlightPOI: (poiId: string) => void;
  searchQuery?: string;
}

interface MapBoundsSnapshot {
  south: number;
  west: number;
  north: number;
  east: number;
}

const MARKER_BATCH_SIZE = 40;

const CATEGORY_EMOJIS: Record<string, string> = {
  관광지: '🏞️',
  문화유산: '🏛️',
  설화: '📜',
  인물: '👤',
  음식: '🍲',
  축제: '🎆',
  교육: '📚'
};

export const KakaoPOIMap: React.FC<KakaoPOIMapProps> = ({
  userLocation,
  pois,
  selectedCategory,
  highlightedPOIId,
  onHighlightPOI,
  searchQuery = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBoundsSnapshot | null>(null);

  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'HYBRID'>('ROADMAP');

  // Apply semantic filters first. Geographic visibility is determined by the
  // live Kakao map viewport below, not by a fixed radius.
  const matchingPOIs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return pois
      .map((poi) => {
        const distMeters = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          poi.latitude,
          poi.longitude
        );
        return { poi, distMeters };
      })
      .filter(({ poi }) => {
        if (selectedCategory !== 'all' && poi.category !== selectedCategory) {
          return false;
        }

        if (normalizedQuery) {
          const matchName = poi.name.toLowerCase().includes(normalizedQuery);
          const matchRegion = poi.region.toLowerCase().includes(normalizedQuery);
          const matchTags = poi.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
          if (!matchName && !matchRegion && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => a.distMeters - b.distMeters);
  }, [pois, userLocation, selectedCategory, searchQuery]);

  const visiblePOIs = useMemo(() => {
    if (!mapBounds) return [];

    return matchingPOIs.filter(({ poi }) => (
      poi.latitude >= mapBounds.south &&
      poi.latitude <= mapBounds.north &&
      poi.longitude >= mapBounds.west &&
      poi.longitude <= mapBounds.east
    ));
  }, [mapBounds, matchingPOIs]);

  // Many archive records share a fallback coordinate. Render one marker for
  // each exact coordinate while keeping every POI available in the list.
  const visibleMarkerGroups = useMemo(() => {
    const groups = new Map<string, POISummary[]>();

    visiblePOIs.forEach(({ poi }) => {
      const coordinateKey = `${poi.latitude}:${poi.longitude}`;
      const group = groups.get(coordinateKey);
      if (group) group.push(poi);
      else groups.set(coordinateKey, [poi]);
    });

    return Array.from(groups.values());
  }, [visiblePOIs]);

  const fallbackPOIs = matchingPOIs.slice(0, 8);
  const fallbackMaxDistance = fallbackPOIs[fallbackPOIs.length - 1]?.distMeters || 1;

  // Load Kakao Maps SDK
  const initKakaoSDK = useCallback(async () => {
    const key = kakaoMapService.getAppKey();
    if (!key) {
      setLoadError('missing-key');
      setMapLoaded(false);
      return;
    }

    try {
      setLoadError(null);
      await kakaoMapService.loadSDK(key);
      setMapLoaded(true);
    } catch (err: any) {
      console.warn('Kakao Maps SDK Load Error:', err);
      setLoadError(err.message || '카카오 지도를 불러오지 못했습니다.');
      setMapLoaded(false);
    }
  }, []);

  useEffect(() => {
    initKakaoSDK();
  }, [initKakaoSDK]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.kakao?.maps) return;

    try {
      const container = mapContainerRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        level: 6
      };

      const map = new window.kakao.maps.Map(container, options);
      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Error instantiating Kakao Map:', err);
    }
  }, [mapLoaded]);

  // Synchronize React state after Kakao finishes a pan or zoom. Zooming out
  // expands these bounds, so more markers and list items become visible.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !window.kakao?.maps) return;

    const syncMapBounds = () => {
      const bounds = map.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const nextBounds: MapBoundsSnapshot = {
        south: southWest.getLat(),
        west: southWest.getLng(),
        north: northEast.getLat(),
        east: northEast.getLng()
      };

      setMapBounds((previous) => {
        if (
          previous &&
          previous.south === nextBounds.south &&
          previous.west === nextBounds.west &&
          previous.north === nextBounds.north &&
          previous.east === nextBounds.east
        ) {
          return previous;
        }
        return nextBounds;
      });
    };

    window.kakao.maps.event.addListener(map, 'idle', syncMapBounds);

    const resizeTimer = window.setTimeout(() => {
      map.relayout();
      map.setCenter(new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng));
      syncMapBounds();
    }, 100);

    return () => {
      window.clearTimeout(resizeTimer);
      window.kakao.maps.event.removeListener(map, 'idle', syncMapBounds);
    };
  }, [mapLoaded, userLocation.lat, userLocation.lng]);

  // Clear existing markers & overlays
  const clearMapElements = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, []);

  // Update the current location and POI markers visible in the map viewport.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !window.kakao?.maps) return;

    clearMapElements();

    const userLatLng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    // Distinguish the current location from native POI pins with a compact
    // red location dot, matching the familiar Kakao Map app convention.
    const currentLocationDot = document.createElement('div');
    currentLocationDot.className = 'kakao-current-location-dot';
    currentLocationDot.setAttribute('role', 'img');
    currentLocationDot.setAttribute('aria-label', '현재 위치');
    currentLocationDot.innerHTML = '<span class="current-location-dot-core"></span>';

    const userMarker = new window.kakao.maps.CustomOverlay({
      position: userLatLng,
      content: currentLocationDot,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 10
    });
    userMarker.setMap(map);
    userMarkerRef.current = userMarker;

    let nextMarkerIndex = 0;
    let markerFrameId: number | null = null;
    let isCancelled = false;

    const renderNextMarkerBatch = () => {
      if (isCancelled) return;

      const batch = visibleMarkerGroups.slice(
        nextMarkerIndex,
        nextMarkerIndex + MARKER_BATCH_SIZE
      );

      batch.forEach((poiGroup) => {
        const poi = poiGroup[0];
        const poiLatLng = new window.kakao.maps.LatLng(poi.latitude, poi.longitude);
        const selectedPOI = poiGroup.find(({ id }) => id === highlightedPOIId);
        const isSelected = Boolean(selectedPOI);
        const groupLabel = poiGroup.length > 1
          ? `${poi.name} 외 ${poiGroup.length - 1}개`
          : poi.name;
        const markerElement = document.createElement('button');
        markerElement.type = 'button';
        markerElement.className = `kakao-poi-marker${isSelected ? ' selected' : ''}`;
        markerElement.title = groupLabel;
        markerElement.setAttribute('aria-label', `${groupLabel} 중 명소 선택`);
        markerElement.innerHTML = '<span class="kakao-poi-marker-shape"></span>';
        markerElement.onclick = (event) => {
          event.stopPropagation();
          onHighlightPOI(selectedPOI?.id ?? poi.id);
        };

        const markerOverlay = new window.kakao.maps.CustomOverlay({
          position: poiLatLng,
          content: markerElement,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: isSelected ? 8 : 4
        });
        markerOverlay.setMap(map);
        markersRef.current.push(markerOverlay);
      });

      nextMarkerIndex += batch.length;
      if (nextMarkerIndex < visibleMarkerGroups.length) {
        markerFrameId = window.requestAnimationFrame(renderNextMarkerBatch);
      }
    };

    renderNextMarkerBatch();

    return () => {
      isCancelled = true;
      if (markerFrameId !== null) {
        window.cancelAnimationFrame(markerFrameId);
      }
      clearMapElements();
    };
  }, [
    mapLoaded,
    userLocation,
    visibleMarkerGroups,
    highlightedPOIId,
    onHighlightPOI,
    clearMapElements
  ]);

  // Center map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current && window.kakao?.maps) {
      const userLatLng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      mapInstanceRef.current.panTo(userLatLng);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level - 1, { animate: true });
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const level = mapInstanceRef.current.getLevel();
      mapInstanceRef.current.setLevel(level + 1, { animate: true });
    }
  };

  // Toggle map type (Roadmap vs Hybrid/Skyview)
  const handleToggleMapType = () => {
    if (mapInstanceRef.current && window.kakao?.maps) {
      if (mapTypeId === 'ROADMAP') {
        mapInstanceRef.current.setMapTypeId(window.kakao.maps.MapTypeId.HYBRID);
        setMapTypeId('HYBRID');
      } else {
        mapInstanceRef.current.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
        setMapTypeId('ROADMAP');
      }
    }
  };

  return (
    <div className="kakao-poi-map-wrapper">
      {/* Kakao Map Container */}
      <div className="kakao-map-container-frame">
        <div
          ref={mapContainerRef}
          className={`kakao-actual-map ${mapLoaded ? 'loaded' : 'hidden'}`}
          id="kakao-poi-map-view"
        />

        {/* Fallback / Loading Radar Canvas when Kakao is not yet active */}
        {!mapLoaded && (
          <div className="kakao-map-radar-fallback">
            <div className="radar-grid">
              <div className="radar-circle circle-1"></div>
              <div className="radar-circle circle-2"></div>
              <div className="radar-circle circle-3"></div>
              <div className="radar-sweep"></div>
              <div className="radar-center-user">
                <span>📍 내 위치</span>
              </div>

              {fallbackPOIs.map(({ poi, distMeters }, idx) => {
                const angle = (idx * (360 / Math.max(fallbackPOIs.length, 1))) * (Math.PI / 180);
                const distanceRatio = Math.min(distMeters / fallbackMaxDistance, 0.9);
                const left = 50 + Math.cos(angle) * (distanceRatio * 42);
                const top = 50 + Math.sin(angle) * (distanceRatio * 42);

                return (
                  <button
                    key={poi.id}
                    type="button"
                    className="radar-poi-dot"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    onClick={() => onHighlightPOI(poi.id)}
                    title={`${poi.name} (${formatDistance(distMeters)})`}
                  >
                    <span className="dot-emoji">{CATEGORY_EMOJIS[poi.category] || '📍'}</span>
                    <span className="dot-name">{poi.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="radar-caption">
              {loadError
                ? '카카오 지도를 불러오지 못했습니다.'
                : '카카오 지도를 불러오고 있습니다...'}
            </div>
          </div>
        )}

        {/* Floating Map Action Buttons */}
        {mapLoaded && (
          <div className="kakao-map-floating-controls">
            <button
              type="button"
              className="map-ctrl-btn recenter-btn"
              onClick={handleRecenter}
              title="내 위치로 이동"
              aria-label="내 위치로 이동"
            >
              <Crosshair size={18} />
            </button>

            <button
              type="button"
              className={`map-ctrl-btn layer-btn ${mapTypeId === 'HYBRID' ? 'active' : ''}`}
              onClick={handleToggleMapType}
              title={mapTypeId === 'ROADMAP' ? '위성지도 보기' : '일반지도 보기'}
              aria-label="지도 모드 변경"
            >
              <Layers size={17} />
            </button>

            <div className="map-ctrl-group zoom-group">
              <button
                type="button"
                className="map-ctrl-btn zoom-btn"
                onClick={handleZoomIn}
                title="확대"
                aria-label="지도 확대"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                className="map-ctrl-btn zoom-btn"
                onClick={handleZoomOut}
                title="축소"
                aria-label="지도 축소"
              >
                <Minus size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
