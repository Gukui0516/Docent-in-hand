import React from 'react';
import { Search, MapPin, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentPlaceName: string;
  onOpenPOIList: () => void;
  onOpenGPSSimulator: () => void;
  onSyncLocation: () => void;
  isGpsActive: boolean;
  gpsLabel?: string;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlaceName,
  onOpenPOIList,
  onOpenGPSSimulator,
  onSyncLocation,
  isGpsActive,
  gpsLabel,
  isSyncing = false
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
            className="header-icon-btn"
            onClick={onOpenPOIList}
            aria-label="제주 명소 및 신화 검색"
            title="제주 명소 및 신화 검색"
          >
            <Search size={18} className="search-btn-icon" />
          </button>
        </div>
      </div>

      <div className="location-bar-wrapper">
        <div className="location-bar" onClick={onOpenGPSSimulator} title="클릭하여 GPS 가상 위치 시뮬레이터 열기">
          <div className="location-info">
            <MapPin size={14} className={`pin-icon ${isGpsActive ? 'active' : ''}`} />
            <span className="location-text">
              현재 위치: <strong>{currentPlaceName}</strong> {gpsLabel && <span className="gps-label">({gpsLabel})</span>}
            </span>
          </div>
          <button
            type="button"
            className={`location-sync-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSyncLocation();
            }}
            title="현재 기기 GPS 실시간 위치 동기화"
          >
            <RefreshCw size={12} className={`sync-icon ${isSyncing ? 'spin' : ''}`} />
            <span>{isSyncing ? '동기화 중...' : '위치 동기화'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
