import React from 'react';
import { Compass, Zap, MapPin, Navigation } from 'lucide-react';

interface HeaderProps {
  currentPlaceName: string;
  onOpenBenchmark: () => void;
  onOpenPOIList: () => void;
  onOpenGPSSimulator: () => void;
  isGpsActive: boolean;
  gpsLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlaceName,
  onOpenBenchmark,
  onOpenPOIList,
  onOpenGPSSimulator,
  isGpsActive,
  gpsLabel
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-group">
          <div className="brand-logo">
            <span className="logo-emoji">🏝️</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">내 손안의 도슨트</h1>
            <p className="brand-subtitle">제주 신화·자연 1인칭 AI 도슨트</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="action-pill map-pill"
            onClick={onOpenPOIList}
            title="다른 제주 명소 둘러보기"
          >
            <Compass size={15} className="action-icon" />
            <span>명소 목록</span>
          </button>

          <button
            type="button"
            className="action-pill benchmark-pill"
            onClick={onOpenBenchmark}
            title="검색 엔진 A/B 벤치마크"
          >
            <Zap size={15} className="action-icon zap" />
            <span>A/B 비교</span>
          </button>
        </div>
      </div>

      <div className="location-bar" onClick={onOpenGPSSimulator} title="GPS 위치 변경 및 시뮬레이션">
        <div className="location-info">
          <MapPin size={14} className={`pin-icon ${isGpsActive ? 'active' : ''}`} />
          <span className="location-text">
            현재 위치: <strong>{currentPlaceName}</strong> {gpsLabel && <span className="gps-label">({gpsLabel})</span>}
          </span>
        </div>
        <button type="button" className="gps-change-btn">
          <Navigation size={12} />
          <span>GPS 설정</span>
        </button>
      </div>
    </header>
  );
};
