import React from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

interface HeaderProps {
  currentPlaceName: string;
  onOpenPOIList: () => void;
  onOpenGPSSimulator: () => void;
  isGpsActive: boolean;
  gpsLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlaceName,
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
            className={`header-icon-btn ${isGpsActive ? 'active-gps' : ''}`}
            onClick={onOpenGPSSimulator}
            aria-label="GPS 위치 설정 및 시뮬레이터"
            title="GPS 위치 설정 및 시뮬레이터"
          >
            <Navigation size={17} className="nav-btn-icon" />
          </button>
          <button
            type="button"
            className="header-icon-btn"
            onClick={onOpenPOIList}
            aria-label="제주 명소 및 신화 검색"
            title="제주 명소 및 신화 검색"
          >
            <Search size={17} className="search-btn-icon" />
          </button>
        </div>
      </div>

      <div className="location-bar-wrapper">
        <div className="location-bar" onClick={onOpenGPSSimulator} title="클릭하여 GPS 위치 변경">
          <div className="location-info">
            <MapPin size={14} className={`pin-icon ${isGpsActive ? 'active' : ''}`} />
            <span className="location-text">
              현재 위치: <strong>{currentPlaceName}</strong> {gpsLabel && <span className="gps-label">({gpsLabel})</span>}
            </span>
          </div>
          <span className="location-bar-change-hint">
            위치 변경 ↗
          </span>
        </div>
      </div>
    </header>
  );
};
