import React, { useState } from 'react';
import { X, Navigation, Compass, CheckCircle2, Search, MapPin, Loader2 } from 'lucide-react';
import { kakaoMapService } from '../services/kakaoMapService';

interface GPSSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  onApplyCoordinates: (lat: number, lng: number, label: string) => void;
  onUseRealGPS: () => void;
  isRealGpsActive: boolean;
}

interface SearchResultItem {
  title: string;
  address: string;
  lat: number;
  lng: number;
}

interface PresetLocation {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  targetPOIName: string;
  description: string;
}

const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'jejunudeng',
    name: '제주대학교 공과대학 4호관',
    region: '제주시 아라1동',
    lat: 33.4552,
    lng: 126.5620,
    targetPOIName: '아라 1동 / 인다마을',
    description: '반경 400m 이내 - 아라동 인근 역사 탐색'
  },
  {
    id: 'seongsan',
    name: '성산일출봉 주차장 앞',
    region: '서귀포시 성산읍',
    lat: 33.4590,
    lng: 126.9415,
    targetPOIName: '성산일출봉',
    description: '반경 80m 이내 - 설문대할망 자동 배정'
  },
  {
    id: 'sanbang',
    name: '산방산 탄산온천 앞',
    region: '서귀포시 안덕면',
    lat: 33.2380,
    lng: 126.3145,
    targetPOIName: '제주 서귀포 산방산',
    description: '반경 200m 이내 - 설문대할망 자동 배정'
  },
  {
    id: 'hyeopjae',
    name: '협재 해변 카페거리',
    region: '제주시 한림읍',
    lat: 33.3938,
    lng: 126.2405,
    targetPOIName: '협재해수욕장 & 해녀 바당',
    description: '반경 90m 이내 - 해녀 삼춘 자동 배정'
  },
  {
    id: 'manjang',
    name: '만장굴 매표소 입구',
    region: '제주시 구좌읍',
    lat: 33.5280,
    lng: 126.7720,
    targetPOIName: '만장굴',
    description: '반경 50m 이내 - 설문대할망 자동 배정'
  },
  {
    id: 'gwandeok',
    name: '제주 관덕정 광장',
    region: '제주시 삼도2동',
    lat: 33.5135,
    lng: 126.5215,
    targetPOIName: '제주목관아 & 관덕정',
    description: '반경 30m 이내 - 돌하르방 자동 배정'
  },
  {
    id: 'cheonjiyeon',
    name: '서귀포 천지연폭포 산책로',
    region: '서귀포시 천지동',
    lat: 33.2450,
    lng: 126.5590,
    targetPOIName: '천지연폭포',
    description: '반경 60m 이내 - 설문대할망 자동 배정'
  }
];

export const GPSSimulatorModal: React.FC<GPSSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentLat,
  currentLng,
  onApplyCoordinates,
  onUseRealGPS,
  isRealGpsActive
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'search' | 'custom'>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [customLat, setCustomLat] = useState<string>(currentLat.toString());
  const [customLng, setCustomLng] = useState<string>(currentLng.toString());

  if (!isOpen) return null;

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await kakaoMapService.searchAddressOrKeyword(searchQuery);
      if (results.length === 0) {
        setSearchError('검색 결과가 없습니다. 도로명 주소나 지명(예: 성산일출봉, 애월읍)을 입력해보세요.');
      }
      setSearchResults(results);
    } catch (err: any) {
      console.warn('Kakao address search error:', err);
      setSearchError('카카오 주소 검색을 실행할 수 없습니다. 지도 API 키 설정을 확인해 주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onApplyCoordinates(lat, lng, '사용자 지정 좌표');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet gps-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="title-with-badge">
              <Navigation size={20} className="nav-icon" />
              <h3>GPS 실시간 위치 시뮬레이터</h3>
            </div>
            <p>실제 제주 현장에 있지 않아도 주소 검색이나 좌표 이동으로 자동 매핑을 테스트할 수 있습니다.</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Real Device GPS Button */}
        <div className="real-gps-card">
          <div className="real-gps-info">
            <Compass size={22} className="compass-icon" />
            <div>
              <strong>실제 내 기기 GPS 실시간 감지</strong>
              <p>현재 감지된 내 좌표: <code>{currentLat.toFixed(4)}, {currentLng.toFixed(4)}</code></p>
              <span className="gps-status-subtext">
                {isRealGpsActive ? '🟢 실제 브라우저 Geolocation 활성화됨' : '⚪ 버튼을 눌러 실제 기기 GPS 좌표를 다시 가져옵니다'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={`btn-real-gps ${isRealGpsActive ? 'active' : ''}`}
            onClick={() => {
              onUseRealGPS();
              onClose();
            }}
          >
            {isRealGpsActive ? '🔄 GPS 재측정' : '📡 내 위치 가져오기'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="gps-modal-tabs" style={{ display: 'flex', gap: '8px', marginTop: '12px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'preset' ? '#00695C' : '#f0f0f0',
              color: activeTab === 'preset' ? '#fff' : '#555',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('preset')}
          >
            📍 주요 랜드마크 (7곳)
          </button>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'search' ? '#00695C' : '#f0f0f0',
              color: activeTab === 'search' ? '#fff' : '#555',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('search')}
          >
            🔍 카카오 주소/장소 검색
          </button>
          <button
            type="button"
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'custom' ? '#00695C' : '#f0f0f0',
              color: activeTab === 'custom' ? '#fff' : '#555',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('custom')}
          >
            ✏️ 위경도 직접 입력
          </button>
        </div>

        {/* Tab 1: Preset Locations Grid */}
        {activeTab === 'preset' && (
          <div className="preset-section" style={{ marginTop: '10px' }}>
            <div className="preset-list">
              {PRESET_LOCATIONS.map((preset) => {
                const isMatched = Math.abs(currentLat - preset.lat) < 0.005 && Math.abs(currentLng - preset.lng) < 0.005;

                return (
                  <div
                    key={preset.id}
                    className={`preset-card ${isMatched ? 'selected' : ''}`}
                    onClick={() => {
                      onApplyCoordinates(preset.lat, preset.lng, preset.name);
                      onClose();
                    }}
                  >
                    <div className="preset-card-header">
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-region">{preset.region}</span>
                    </div>
                    <div className="preset-expected">
                      🎯 <strong>자동 매칭 대상:</strong> {preset.targetPOIName}
                    </div>
                    <div className="preset-desc">{preset.description}</div>
                    {isMatched && (
                      <div className="selected-badge">
                        <CheckCircle2 size={13} /> 현재 시뮬레이션 중인 위치
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Kakao Address / Keyword Search */}
        {activeTab === 'search' && (
          <div className="address-search-section" style={{ marginTop: '12px' }}>
            <form onSubmit={handleSearchAddress} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: '#888' }} />
                <input
                  type="text"
                  placeholder="예: 제주시 중앙로, 성산읍 일출로, 협재리..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: '10px 16px',
                  background: '#00695C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSearching ? <Loader2 size={16} className="spin" /> : '검색'}
              </button>
            </form>

            {searchError && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#FFF3E0', color: '#E65100', borderRadius: '6px', fontSize: '12px' }}>
                {searchError}
              </div>
            )}

            <div className="search-results-list" style={{ marginTop: '12px', maxHeight: '240px', overflowY: 'auto' }}>
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    borderRadius: '6px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#E0F2F1')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    onApplyCoordinates(result.lat, result.lng, result.title);
                    onClose();
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#004D40', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#00695C" />
                    <span>{result.title}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', paddingLeft: '17px' }}>
                    {result.address}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', paddingLeft: '17px' }}>
                    좌표: {result.lat.toFixed(5)}, {result.lng.toFixed(5)} (클릭하여 이 위치로 이동)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Custom Coordinates Input */}
        {activeTab === 'custom' && (
          <form className="custom-coord-form" onSubmit={handleApplyCustom} style={{ marginTop: '12px' }}>
            <div className="coord-inputs-row">
              <div className="coord-field">
                <label>위도 (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="예: 33.4586"
                />
              </div>
              <div className="coord-field">
                <label>경도 (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  placeholder="예: 126.9423"
                />
              </div>
            </div>
            <button type="submit" className="btn-apply-coord">
              이 좌표로 이동하여 자동 매핑 실행
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
