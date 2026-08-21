import React, { useState, useEffect, useRef } from 'react';
import { POI, POIImage } from '../types/docent';
import { MapPin, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
  onSyncLocation: () => void;
  onOpenLocationSettings: () => void;
  isSyncing?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  poi,
  distanceText,
  onSyncLocation,
  onOpenLocationSettings,
  isSyncing = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize image list (supports multiple images or single fallback)
  const imageList: POIImage[] = poi.images && poi.images.length > 0
    ? poi.images
    : [
        {
          src: poi.imageUrl,
          alt: poi.imageTitle || poi.name,
          source: poi.imageSource
        }
      ];

  const totalImages = imageList.length;
  const currentImage = imageList[currentIndex] || imageList[0];

  // Reset index when POI changes
  useEffect(() => {
    setCurrentIndex(0);
    setLoadedMap({});
    setErrorMap({});
    setIsAutoPlay(true);
  }, [poi.id]);

  // Auto Slideshow Timer (6.0s interval)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isAutoPlay && totalImages > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      }, 6000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, totalImages, currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  return (
    <section className="photo-card-container" aria-label="대표 명소 현장 사진 카드">
      <div
        className="photo-card"
        onMouseEnter={() => totalImages > 1 && setIsAutoPlay(false)}
        onMouseLeave={() => totalImages > 1 && setIsAutoPlay(true)}
      >
        {/* Background Image Container with Smooth Sliding Track */}
        <div className="image-wrapper">
          {/* Smooth Horizontal Sliding Track */}
          <div
            className="slideshow-track"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 1.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {imageList.map((img, idx) => (
              <div key={idx} className="slideshow-slide">
                {!loadedMap[idx] && !errorMap[idx] && (
                  <div className="image-skeleton">
                    <ImageIcon className="skeleton-icon" size={32} />
                    <span>공식 아카이브 사진 불러오는 중...</span>
                  </div>
                )}
                <img
                  src={
                    errorMap[idx]
                      ? 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80'
                      : img.src
                  }
                  alt={img.alt || poi.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className={`poi-image ${loadedMap[idx] ? 'loaded' : 'loading'}`}
                  onLoad={() => setLoadedMap((prev) => ({ ...prev, [idx]: true }))}
                  onError={() => {
                    setErrorMap((prev) => ({ ...prev, [idx]: true }));
                    setLoadedMap((prev) => ({ ...prev, [idx]: true }));
                  }}
                />
              </div>
            ))}
          </div>

          {/* Gradient Overlay */}
          <div className="image-overlay" />

          {totalImages > 1 && (
            <div
              className="photo-dot-indicator"
              role="status"
              aria-label={`${totalImages}장 중 ${currentIndex + 1}번째 사진`}
            >
              {imageList.map((_, index) => (
                <i key={index} className={index === currentIndex ? 'active' : ''} aria-hidden="true" />
              ))}
            </div>
          )}

          {/* Invisible edge navigation zones; the center remains non-interactive. */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className="photo-nav-zone photo-nav-zone-left"
                onClick={handlePrev}
                aria-label="이전 사진 보기"
              />
              <button
                type="button"
                className="photo-nav-zone photo-nav-zone-right"
                onClick={handleNext}
                aria-label="다음 사진 보기"
              />
            </>
          )}

          {/* Bottom Info Overlay */}
          <div className="card-bottom-info">
            <div className="poi-region">{poi.region}</div>
            <h2 className="poi-title">{poi.name}</h2>
            {currentImage.alt && currentImage.alt !== poi.name && (
              <div className="photo-subtitle" style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.85rem',
                marginTop: '2px',
                marginBottom: '6px',
                transition: 'opacity 0.3s ease'
              }}>
                📷 {currentImage.alt}
              </div>
            )}
            <div className="tag-list">
              {poi.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="poi-tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Location utility bar */}
        <div className="source-bar">
          <button
            type="button"
            className="source-current-location"
            onClick={onOpenLocationSettings}
            title="GPS 위치 설정 열기"
          >
            <MapPin size={13} aria-hidden="true" />
            <span>현재 위치</span>
            <strong>{poi.name}</strong>
            <em>· {distanceText}</em>
          </button>
          <div className="source-bar-actions">
            <button
              type="button"
              className={`source-gps-button ${isSyncing ? 'syncing' : ''}`}
              onClick={onSyncLocation}
              title="현재 기기 GPS 위치 다시 찾기"
              aria-label="현재 위치 다시 찾기"
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
              <span>{isSyncing ? '찾는 중' : '내 위치'}</span>
            </button>
          </div>
        </div>
      </div>

    </section>
  );
};
