import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { POISummary } from '../types/docent';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { kakaoMapService } from '../services/kakaoMapService';
import {
  MapPin,
  Navigation,
  Crosshair,
  Layers,
  Sparkles,
  Key,
  CheckCircle,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';

interface KakaoPOIMapProps {
  userLocation: { lat: number; lng: number };
  pois: POISummary[];
  selectedCategory: string; // 'all' or category name
  selectedPOIId?: string;
  onSelectPOI: (poi: POISummary, distMeters: number) => void;
  searchQuery?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  관광지: '🏞️',
  문화유산: '🏛️',
  설화: '📜',
  인물: '👤',
  음식: '🍲',
  축제: '🎆',
  교육: '📚'
};

const CATEGORY_COLORS: Record<string, string> = {
  관광지: '#00897B',
  문화유산: '#D84315',
  설화: '#6A1B9A',
  인물: '#1565C0',
  음식: '#E65100',
  축제: '#C2185B',
  교육: '#2E7D32'
};

export const KakaoPOIMap: React.FC<KakaoPOIMapProps> = ({
  userLocation,
  pois,
  selectedCategory,
  selectedPOIId,
  onSelectPOI,
  searchQuery = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const userCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(kakaoMapService.hasAppKey());
  const [keyInput, setKeyInput] = useState<string>(kakaoMapService.getAppKey());
  const [isKeySaving, setIsKeySaving] = useState(false);
  const [showKeyForm, setShowKeyForm] = useState(false);

  const [mapRadiusMeters, setMapRadiusMeters] = useState<number>(1000); // 1km default
  const [activePOIPreview, setActivePOIPreview] = useState<{
    poi: POISummary;
    distMeters: number;
  } | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'ROADMAP' | 'HYBRID'>('ROADMAP');

  // Filter POIs strictly within radius and matching category & search
  const nearbyPOIs = useMemo(() => {
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
      .filter(({ poi, distMeters }) => {
        // 1) Radius filter
        if (distMeters > mapRadiusMeters) return false;

        // 2) Category filter
        if (selectedCategory !== 'all' && poi.category !== selectedCategory) {
          return false;
        }

        // 3) Search query filter
        if (normalizedQuery) {
          const matchName = poi.name.toLowerCase().includes(normalizedQuery);
          const matchRegion = poi.region.toLowerCase().includes(normalizedQuery);
          const matchTags = poi.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
          if (!matchName && !matchRegion && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => a.distMeters - b.distMeters);
  }, [pois, userLocation, mapRadiusMeters, selectedCategory, searchQuery]);

  // Load Kakao Maps SDK
  const initKakaoSDK = useCallback(async (customKey?: string) => {
    const key = customKey || kakaoMapService.getAppKey();
    if (!key) {
      setHasKey(false);
      return;
    }

    try {
      setLoadError(null);
      await kakaoMapService.loadSDK(key);
      setHasKey(true);
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

  // Handle saving API key
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setIsKeySaving(true);
    kakaoMapService.setAppKey(keyInput.trim());
    await initKakaoSDK(keyInput.trim());
    setIsKeySaving(false);
    setShowKeyForm(false);
  };

  // Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.kakao?.maps) return;

    try {
      const container = mapContainerRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        level: 4 // Suitable zoom level for 1km radius
      };

      const map = new window.kakao.maps.Map(container, options);
      mapInstanceRef.current = map;

      // Handle map resize on container mount
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.relayout();
          mapInstanceRef.current.setCenter(
            new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
          );
        }
      }, 100);
    } catch (err) {
      console.error('Error instantiating Kakao Map:', err);
    }
  }, [mapLoaded]);

  // Clear existing markers & overlays
  const clearMapElements = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    if (userCircleRef.current) {
      userCircleRef.current.setMap(null);
      userCircleRef.current = null;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  }, []);

  // Update User Marker, 1km Circle, and Nearby POI Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded || !window.kakao?.maps) return;

    clearMapElements();

    const userLatLng = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);

    // 1. Draw 1km Radius Circle
    const circle = new window.kakao.maps.Circle({
      center: userLatLng,
      radius: mapRadiusMeters,
      strokeWeight: 2,
      strokeColor: '#00897B',
      strokeOpacity: 0.85,
      strokeStyle: 'dashed',
      fillColor: '#00897B',
      fillOpacity: 0.09
    });
    circle.setMap(map);
    userCircleRef.current = circle;

    // 2. Draw User Location Marker (Custom Pulse Overlay)
    const userMarkerContent = document.createElement('div');
    userMarkerContent.className = 'kakao-user-location-marker';
    userMarkerContent.innerHTML = `
      <div class="user-pulse-ring"></div>
      <div class="user-center-dot">
        <span class="user-icon">📍</span>
      </div>
      <div class="user-label-pill">현재 위치</div>
    `;

    const userOverlay = new window.kakao.maps.CustomOverlay({
      position: userLatLng,
      content: userMarkerContent,
      yAnchor: 1.1,
      zIndex: 10
    });
    userOverlay.setMap(map);
    userMarkerRef.current = userOverlay;

    // 3. Draw POI Markers within 1km
    nearbyPOIs.forEach(({ poi, distMeters }) => {
      const poiLatLng = new window.kakao.maps.LatLng(poi.latitude, poi.longitude);
      const isSelected = poi.id === selectedPOIId;
      const emoji = CATEGORY_EMOJIS[poi.category] || '📍';
      const badgeColor = CATEGORY_COLORS[poi.category] || '#00897B';

      const markerDiv = document.createElement('div');
      markerDiv.className = `kakao-poi-pin ${isSelected ? 'selected' : ''}`;
      markerDiv.style.setProperty('--cat-color', badgeColor);
      markerDiv.innerHTML = `
        <div class="poi-pin-bubble" style="border-color: ${badgeColor};">
          <span class="poi-emoji">${emoji}</span>
          <span class="poi-pin-name">${poi.name}</span>
        </div>
        <div class="poi-pin-stem" style="background-color: ${badgeColor};"></div>
      `;

      markerDiv.onclick = (e) => {
        e.stopPropagation();
        setActivePOIPreview({ poi, distMeters });
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: poiLatLng,
        content: markerDiv,
        yAnchor: 1.0,
        zIndex: isSelected ? 8 : 4
      });

      customOverlay.setMap(map);
      overlaysRef.current.push(customOverlay);
    });
  }, [
    mapLoaded,
    userLocation,
    nearbyPOIs,
    selectedPOIId,
    mapRadiusMeters,
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
      {/* Map Header Status & Control Bar */}
      <div className="kakao-map-top-bar">
        <div className="map-radius-badge">
          <Navigation size={13} className="radius-icon pulse" />
          <span className="radius-text">
            반경 <strong>{formatDistance(mapRadiusMeters)}</strong> 내
          </span>
          <span className="nearby-count-pill">
            <strong>{nearbyPOIs.length}</strong>개{' '}
            {selectedCategory !== 'all' ? selectedCategory : '명소'}
          </span>
        </div>

        <div className="map-radius-toggle-group">
          <button
            type="button"
            className={`radius-tab-btn ${mapRadiusMeters === 1000 ? 'active' : ''}`}
            onClick={() => setMapRadiusMeters(1000)}
            title="반경 1km 탐색"
          >
            1km
          </button>
          <button
            type="button"
            className={`radius-tab-btn ${mapRadiusMeters === 2000 ? 'active' : ''}`}
            onClick={() => setMapRadiusMeters(2000)}
            title="반경 2km 탐색"
          >
            2km
          </button>
          <button
            type="button"
            className={`radius-tab-btn ${mapRadiusMeters === 3000 ? 'active' : ''}`}
            onClick={() => setMapRadiusMeters(3000)}
            title="반경 3km 탐색"
          >
            3km
          </button>
          <button
            type="button"
            className="btn-map-settings"
            onClick={() => setShowKeyForm((prev) => !prev)}
            title="카카오 지도 API 키 설정"
          >
            <Key size={13} />
          </button>
        </div>
      </div>

      {/* API Key Registration Card (if no key or toggled) */}
      {(!hasKey || showKeyForm || loadError) && (
        <div className="kakao-key-setup-card">
          <div className="key-card-header">
            <div className="key-title">
              <Key size={15} />
              <span>카카오 지도 Javascript API 키 설정</span>
            </div>
            {hasKey && (
              <button
                type="button"
                className="btn-text-close"
                onClick={() => setShowKeyForm(false)}
              >
                닫기
              </button>
            )}
          </div>

          <p className="key-desc">
            현재 위치 기준 1km 내 명소와 지도를 실시간으로 표시하기 위해{' '}
            <strong>카카오 지도 Javascript 키</strong>가 필요합니다.
          </p>

          <form onSubmit={handleSaveKey} className="key-input-form">
            <input
              type="text"
              className="kakao-key-input"
              placeholder="카카오 개발자 콘솔의 JavaScript 키 입력"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              required
            />
            <button type="submit" className="btn-save-kakao-key" disabled={isKeySaving}>
              {isKeySaving ? (
                '연결 중...'
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>적용</span>
                </>
              )}
            </button>
          </form>

          <div className="key-guide-links">
            <a
              href="https://developers.kakao.com/console/app"
              target="_blank"
              rel="noopener noreferrer"
              className="guide-link"
            >
              <span>Kakao Developers 키 발급 바로가기</span>
              <ExternalLink size={11} />
            </a>
            <span className="guide-note">
              (웹 플랫폼 사이트 도메인에 <code>http://localhost:5173</code> 등록 필요)
            </span>
          </div>

          {loadError && <div className="kakao-error-msg">⚠️ {loadError}</div>}
        </div>
      )}

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

              {/* Visualized POIs inside 1km radius on radar fallback */}
              {nearbyPOIs.slice(0, 8).map(({ poi, distMeters }, idx) => {
                const angle = (idx * (360 / Math.min(nearbyPOIs.length, 8))) * (Math.PI / 180);
                const distanceRatio = Math.min(distMeters / mapRadiusMeters, 0.9);
                const left = 50 + Math.cos(angle) * (distanceRatio * 42);
                const top = 50 + Math.sin(angle) * (distanceRatio * 42);

                return (
                  <button
                    key={poi.id}
                    type="button"
                    className="radar-poi-dot"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    onClick={() => onSelectPOI(poi, distMeters)}
                    title={`${poi.name} (${formatDistance(distMeters)})`}
                  >
                    <span className="dot-emoji">{CATEGORY_EMOJIS[poi.category] || '📍'}</span>
                    <span className="dot-name">{poi.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="radar-caption">
              {hasKey
                ? '카카오 지도를 로드하고 있습니다...'
                : '카카오 지도 API 키를 등록하시면 실시간 고화질 지도와 핀이 표시됩니다.'}
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

        {/* POI Active Info Popup Modal over Map */}
        {activePOIPreview && (
          <div className="kakao-poi-preview-card">
            <div className="preview-header">
              <span
                className="preview-cat-badge"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[activePOIPreview.poi.category] || '#00897B'}18`,
                  color: CATEGORY_COLORS[activePOIPreview.poi.category] || '#00897B'
                }}
              >
                {CATEGORY_EMOJIS[activePOIPreview.poi.category] || '📍'}{' '}
                {activePOIPreview.poi.category}
              </span>
              <span className="preview-dist">
                <Navigation size={12} />
                {formatDistance(activePOIPreview.distMeters)}
              </span>
              <button
                type="button"
                className="preview-close-btn"
                onClick={() => setActivePOIPreview(null)}
              >
                ✕
              </button>
            </div>

            <div className="preview-body">
              <h4 className="preview-title">{activePOIPreview.poi.name}</h4>
              <p className="preview-region">
                <MapPin size={12} /> {activePOIPreview.poi.region}
              </p>
            </div>

            <button
              type="button"
              className="btn-select-docent-target"
              onClick={() => {
                onSelectPOI(activePOIPreview.poi, activePOIPreview.distMeters);
                setActivePOIPreview(null);
              }}
            >
              <Sparkles size={15} />
              <span>이 명소 이야기 듣기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
