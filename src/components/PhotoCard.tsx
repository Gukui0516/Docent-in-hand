import React, { useState, useEffect, useRef } from 'react';
import { POI, POIImage, POISummary } from '../types/docent';
import { MapPin, Image as ImageIcon, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
  onSyncLocation: () => void;
  onOpenLocationSettings: () => void;
  isSyncing?: boolean;
  // id 와 개수만 쓰므로 요약 타입으로 충분하다. POI 상세를 요구하면 인덱스 기반
  // 이웃 목록(poi-index.json)을 그대로 넘길 수 없다.
  relevantPOIs?: { poi: POISummary; distMeters: number }[];
  onSelectNextPOI?: () => void;
  onSelectPrevPOI?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  poi,
  distanceText,
  onSyncLocation,
  onOpenLocationSettings,
  isSyncing = false,
  relevantPOIs = [],
  onSelectNextPOI,
  onSelectPrevPOI
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

  // Normalize image list
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

  // Index of current POI in the relevant POIs list
  const currentPOIIndex = relevantPOIs.findIndex((item) => item.poi.id === poi.id);

  // Reset index when POI changes
  useEffect(() => {
    setCurrentIndex(0);
    setLoadedMap({});
    setErrorMap({});
    setIsAutoPlay(true);
    setIsDragging(false);
    setDragOffsetX(0);
  }, [poi.id]);

  // Auto Slideshow Timer
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

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (totalImages > 1) {
      setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
    } else if (onSelectPrevPOI) {
      onSelectPrevPOI();
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (totalImages > 1) {
      setCurrentIndex((prev) => (prev + 1) % totalImages);
    } else if (onSelectNextPOI) {
      onSelectNextPOI();
    }
  };

  // Drag & Swipe Handlers
  const handleStart = (clientX: number) => {
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

    const threshold = 40;
    if (dragOffsetX < -threshold) {
      if (totalImages > 1 && currentIndex < totalImages - 1) {
        handleNextImage();
      } else if (onSelectNextPOI) {
        onSelectNextPOI();
      }
    } else if (dragOffsetX > threshold) {
      if (totalImages > 1 && currentIndex > 0) {
        handlePrevImage();
      } else if (onSelectPrevPOI) {
        onSelectPrevPOI();
      }
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
            cursor: isDragging ? 'grabbing' : 'grab',
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



          {/* Side Navigation Arrow Buttons (Left & Right Edges, Arrow Icons ONLY) */}
          {onSelectPrevPOI && (
            <button
              type="button"
              className="side-nav-arrow-btn left-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onSelectPrevPOI(); }}
              disabled={currentPOIIndex <= 0}
              aria-label="이전 관련 명소"
              title="이전 관련 명소"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {onSelectNextPOI && (
            <button
              type="button"
              className="side-nav-arrow-btn right-arrow-btn"
              onClick={(e) => { e.stopPropagation(); onSelectNextPOI(); }}
              disabled={currentPOIIndex >= relevantPOIs.length - 1}
              aria-label="다음 관련 명소"
              title="다음 관련 명소"
            >
              <ChevronRight size={20} />
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

          {/* Bottom Info Overlay */}
          <div className="card-bottom-info">
            <div className="poi-region">{poi.region}</div>
            <h2 className="poi-title">{poi.name}</h2>
            {currentImage.alt && currentImage.alt !== poi.name && (
              <div className="photo-subtitle" style={{
                color: 'rgba(255, 255, 255, 0.88)',
                fontSize: '0.7rem',
                marginTop: '1px',
                marginBottom: '3px',
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
