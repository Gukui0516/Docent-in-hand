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

interface AreaCluster {
  label: string;
  latitude: number;
  longitude: number;
  count: number;
}

const getAdministrativeAreaLabel = (region: string): string => {
  const normalized = region
    .replace(/\|/g, ' ')
    .replace(/([가-힣]+)\s+([0-9]+동)/g, '$1$2');
  const localityMatches = normalized.match(/[가-힣0-9]+(?:동|읍|면|리)/g);
  if (localityMatches?.length) return localityMatches[localityMatches.length - 1];

  const cityMatch = normalized.match(/[가-힣]+시/);
  return cityMatch?.[0] || '제주 지역';
};

const getCityLabel = (region: string): string => {
  if (region.includes('서귀포시')) return '서귀포시';
  if (region.includes('제주시')) return '제주시';
  return getAdministrativeAreaLabel(region);
};

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
  const [mapLevel, setMapLevel] = useState(5);

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

  const fallbackPOIs = matchingPOIs.slice(0, 8);
  const fallbackMaxDistance = fallbackPOIs[fallbackPOIs.length - 1]?.distMeters || 1;
  const shouldClusterByArea = mapLevel >= 7;

  const areaClusters = useMemo<AreaCluster[]>(() => {
    if (!shouldClusterByArea || !mapBounds) return [];

    // At island-wide zoom, show one aggregate per city. At intermediate zoom,
    // spatial cells keep broad city-only addresses from collapsing together.
    const isCityLevel = mapLevel >= 10;
    const columnCount = mapLevel >= 8 ? 4 : 5;
    const rowCount = mapLevel >= 8 ? 3 : 4;
    const longitudeStep = Math.max(
      (mapBounds.east - mapBounds.west) / columnCount,
      Number.EPSILON
    );
    const latitudeStep = Math.max(
      (mapBounds.north - mapBounds.south) / rowCount,
      Number.EPSILON
    );

    const grouped = new Map<string, {
      latitudeSum: number;
      longitudeSum: number;
      count: number;
      labelCounts: Map<string, number>;
    }>();

    visiblePOIs.forEach(({ poi }) => {
      const label = isCityLevel
        ? getCityLabel(poi.region)
        : getAdministrativeAreaLabel(poi.region);
      const column = Math.min(
        columnCount - 1,
        Math.max(0, Math.floor((poi.longitude - mapBounds.west) / longitudeStep))
      );
      const row = Math.min(
        rowCount - 1,
        Math.max(0, Math.floor((poi.latitude - mapBounds.south) / latitudeStep))
      );
      const cellKey = isCityLevel ? `city:${label}` : `${row}:${column}`;
      const current = grouped.get(cellKey) || {
        latitudeSum: 0,
        longitudeSum: 0,
        count: 0,
        labelCounts: new Map<string, number>()
      };
      current.latitudeSum += poi.latitude;
      current.longitudeSum += poi.longitude;
      current.count += 1;
      current.labelCounts.set(label, (current.labelCounts.get(label) || 0) + 1);
      grouped.set(cellKey, current);
    });

    return Array.from(grouped.values()).map((group) => {
      const labels = Array.from(group.labelCounts.entries());
      const specificLabels = labels.filter(([label]) => !label.endsWith('시'));
      const labelPool = isCityLevel
        ? labels
        : specificLabels.length ? specificLabels : labels;
      const label = labelPool.sort((a, b) => b[1] - a[1])[0]?.[0] || '제주 지역';

      return {
        label,
        latitude: group.latitudeSum / group.count,
        longitude: group.longitudeSum / group.count,
        count: group.count
      };
    });
  }, [mapBounds, mapLevel, shouldClusterByArea, visiblePOIs]);

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
        level: 5
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

      setMapLevel(map.getLevel());

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

    if (shouldClusterByArea) {
      areaClusters.forEach((cluster) => {
        const clusterPosition = new window.kakao.maps.LatLng(
          cluster.latitude,
          cluster.longitude
        );
        const clusterElement = document.createElement('button');
        clusterElement.type = 'button';
        clusterElement.className = 'kakao-area-cluster';
        clusterElement.title = `${cluster.label} 명소 ${cluster.count}개`;
        clusterElement.setAttribute(
          'aria-label',
          `${cluster.label} 명소 ${cluster.count}개, 클릭하여 확대`
        );
        clusterElement.style.setProperty(
          '--cluster-size',
          `${Math.min(76, 58 + Math.sqrt(cluster.count) * 4)}px`
        );

        const areaName = document.createElement('span');
        areaName.className = 'cluster-area-name';
        areaName.textContent = cluster.label;
        const countLabel = document.createElement('strong');
        countLabel.className = 'cluster-count';
        countLabel.textContent = `${cluster.count}개`;
        clusterElement.append(areaName, countLabel);
        clusterElement.onclick = (event) => {
          event.stopPropagation();
          map.setCenter(clusterPosition);
          map.setLevel(Math.max(5, map.getLevel() - 2), { animate: true });
        };

        const clusterOverlay = new window.kakao.maps.CustomOverlay({
          position: clusterPosition,
          content: clusterElement,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 6
        });
        clusterOverlay.setMap(map);
        markersRef.current.push(clusterOverlay);
      });
    } else {
      // At close zoom levels, retain precise native markers for each POI.
      visiblePOIs.forEach(({ poi }) => {
        const poiLatLng = new window.kakao.maps.LatLng(poi.latitude, poi.longitude);
        const isSelected = poi.id === highlightedPOIId;

        const marker = new window.kakao.maps.Marker({
          position: poiLatLng,
          title: poi.name,
          clickable: true
        });
        marker.setMap(map);
        marker.setZIndex(isSelected ? 8 : 4);
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onHighlightPOI(poi.id);
        });
        markersRef.current.push(marker);
      });
    }
  }, [
    areaClusters,
    mapLoaded,
    userLocation,
    visiblePOIs,
    highlightedPOIId,
    onHighlightPOI,
    shouldClusterByArea,
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
