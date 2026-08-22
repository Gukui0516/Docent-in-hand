import React, { useState } from 'react';
import { X, Navigation, Compass, CheckCircle2 } from 'lucide-react';

interface GPSSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  onApplyCoordinates: (lat: number, lng: number, label: string) => void;
  onUseRealGPS: () => void;
  isRealGpsActive: boolean;
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
  const [customLat, setCustomLat] = useState<string>(currentLat.toString());
  const [customLng, setCustomLng] = useState<string>(currentLng.toString());

  if (!isOpen) return null;

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
            <p>실제 제주 현장에 있지 않아도 좌표 이동에 따른 자동 매핑을 테스트할 수 있습니다.</p>
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

        {/* Preset Locations Grid */}
        <div className="preset-section">
          <h4 className="preset-title">📍 제주 주요 랜드마크 가상 이동 (원클릭 매핑)</h4>
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

        {/* Custom Coordinates Input */}
        <form className="custom-coord-form" onSubmit={handleApplyCustom}>
          <h4 className="preset-title">✏️ 임의 위경도 좌표 직접 입력</h4>
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
      </div>
    </div>
  );
};
