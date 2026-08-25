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

// 클러스터 원형 스타일. 개수 구간별로 크기를 키워 밀집도를 한눈에 보이게 한다.
// 색은 개별 핀과 같은 짙은 청록 계열로 맞춘다.
const clusterStyle = (size: number, font: number) => ({
  width: size + 'px',
  height: size + 'px',
  background: 'rgba(0, 105, 92, 0.88)',
  border: '2px solid rgba(255, 255, 255, 0.9)',
  borderRadius: '50%',
  color: '#fff',
  textAlign: 'center',
  fontWeight: '700',
  fontSize: font + 'px',
  lineHeight: (size - 4) + 'px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
});

const CLUSTER_STYLES = [
  clusterStyle(34, 12),  // 2~9
  clusterStyle(42, 13),  // 10~99
  clusterStyle(52, 14),  // 100~999
  clusterStyle(62, 15)   // 1000+
];


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
  const clustererRef = useRef<any>(null);
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
      // 개별 위치를 특정하지 못한 POI 는 핀을 찍지 않는다.
      // 좌표가 시 중심점이라 찍으면 시청 한 점에 수백 개가 쌓인다.
      poi.hasPreciseLocation !== false &&
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
    // 클러스터러가 들고 있는 마커는 clusterer.clear() 로 정리해야 한다.
    // setMap(null) 만 하면 클러스터러 내부 목록에 남아 다음 렌더에서 중복된다.
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
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

    // 클러스터러는 한 번만 만들고 재사용한다. 매번 새로 만들면 이전 인스턴스가
    // 지도에 남아 마커가 중복된다.
    if (!clustererRef.current) {
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        // 카카오 줌 레벨과 축척: 6=500m, 7=1km, 8=2km …
        // 레벨 6(500m) 이하로 확대하면 개별 핀만, 레벨 7(1km)부터는 클러스터만 보이게 한다.
        minLevel: 7,
        // 1 이면 이웃이 없는 단독 마커도 원형으로 표시된다. 2 였을 때는
        // 클러스터와 개별 핀이 한 화면에 섞여 지저분했다.
        minClusterSize: 1,
        disableClickZoom: false,
        styles: CLUSTER_STYLES
      });
    }

    let nextMarkerIndex = 0;
    let markerFrameId: number | null = null;
    let isCancelled = false;
    const pendingForCluster: any[] = [];

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

        const displayPOI = selectedPOI || poi;
        const emoji = CATEGORY_EMOJIS[displayPOI.category] || '📍';

        if (isSelected) {
          markerElement.innerHTML = `
            <div class="kakao-poi-marker-badge">
              <span class="badge-emoji">${emoji}</span>
              <span class="badge-label">${displayPOI.name}</span>
            </div>
            <span class="kakao-poi-marker-shape selected"></span>
          `;
        } else {
          markerElement.innerHTML = '<span class="kakao-poi-marker-shape"></span>';
        }

        markerElement.onclick = (event) => {
          event.stopPropagation();
          onHighlightPOI(selectedPOI?.id ?? poi.id);
        };

        const markerOverlay = new window.kakao.maps.CustomOverlay({
          position: poiLatLng,
          content: markerElement,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: isSelected ? 99 : 4
        });

        // 선택된 핀은 항상 보이도록 클러스터에서 제외한다.
        // 나머지는 클러스터러가 줌 레벨에 따라 묶고 푼다.
        if (isSelected) {
          markerOverlay.setMap(map);
        } else {
          pendingForCluster.push(markerOverlay);
        }
        markersRef.current.push(markerOverlay);
      });

      nextMarkerIndex += batch.length;
      if (nextMarkerIndex < visibleMarkerGroups.length) {
        markerFrameId = window.requestAnimationFrame(renderNextMarkerBatch);
      } else if (clustererRef.current && pendingForCluster.length > 0) {
        clustererRef.current.addMarkers(pendingForCluster);
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

  // 컴포넌트가 사라질 때 클러스터러도 지도에서 떼어낸다.
  useEffect(() => {
    return () => {
      if (clustererRef.current) {
        clustererRef.current.clear();
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    };
  }, []);

  // Pan to selected POI whenever highlightedPOIId changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !highlightedPOIId || !window.kakao?.maps) return;
    const target = pois.find((p) => p.id === highlightedPOIId);
    if (target) {
      const targetLatLng = new window.kakao.maps.LatLng(target.latitude, target.longitude);
      mapInstanceRef.current.panTo(targetLatLng);
    }
  }, [highlightedPOIId, mapLoaded, pois]);

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
