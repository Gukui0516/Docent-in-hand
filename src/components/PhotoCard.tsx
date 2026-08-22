import React, { useState, useEffect, useRef } from 'react';
import { POI, POIImage } from '../types/docent';
import { MapPin, Image as ImageIcon, RefreshCw, ShieldCheck } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
  onSyncLocation: () => void;
  onOpenLocationSettings: () => void;
  onOpenHallucinationLab?: () => void;
  isSyncing?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  poi,
  distanceText,
  onSyncLocation,
  onOpenLocationSettings,
  onOpenHallucinationLab,
  isSyncing = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Drag & Touch Swipe States
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffsetX, setDragOffsetX] = useState(0);

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
    setIsDragging(false);
    setDragOffsetX(0);
  }, [poi.id]);

  // Auto Slideshow Timer (6.0s interval)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isAutoPlay && !isDragging && totalImages > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      }, 6000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, isDragging, totalImages, currentIndex]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  // Drag & Swipe Event Handlers
  const handleStart = (clientX: number) => {
    if (totalImages <= 1) return;
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffsetX(0);
    setIsAutoPlay(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartX;
    setDragOffsetX(deltaX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 40; // minimum drag offset in px to trigger page switch
    if (dragOffsetX < -threshold) {
      handleNext();
    } else if (dragOffsetX > threshold) {
      handlePrev();
    }

    setDragOffsetX(0);
    if (totalImages > 1) {
      setIsAutoPlay(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
    } else if (totalImages > 1) {
      setIsAutoPlay(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStart(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  return (
    <section className="photo-card-container" aria-label="대표 명소 현장 사진 카드">
      <div
        className="photo-card"
        onMouseEnter={() => totalImages > 1 && !isDragging && setIsAutoPlay(false)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Image Container with Smooth Sliding Track */}
        <div
          className="image-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'pan-y',
            cursor: totalImages > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Smooth Horizontal Sliding Track */}
          <div
            className="slideshow-track"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffsetX}px))`,
              transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
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
                  draggable={false}
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

          {/* Hallucination Proof Lab Trigger Button */}
          {onOpenHallucinationLab && (
            <button
              type="button"
              className="grounding-lab-trigger-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenHallucinationLab();
              }}
              title="에이전트 환각 방지 & 팩트 검증 실험실 열기"
            >
              <ShieldCheck size={14} style={{ color: '#38BDF8' }} />
              <span>환각 검증 실험실</span>
            </button>
          )}

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

          {/* Invisible edge navigation zones; active when not dragging */}
          {totalImages > 1 && !isDragging && (
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

