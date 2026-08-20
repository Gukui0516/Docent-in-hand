import React, { useState, useEffect, useRef } from 'react';
import { POI, POIImage } from '../types/docent';
import { MapPin, Image as ImageIcon, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ poi, distanceText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
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
    setImageLoaded(false);
    setImageErrors({});
    setIsAutoPlay(true);
  }, [poi.id]);

  // Auto Slideshow Timer (4.5s interval)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isAutoPlay && totalImages > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalImages);
      }, 4500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, totalImages, currentIndex]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  };

  const handleSelectDot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx === currentIndex) return;
    setImageLoaded(false);
    setCurrentIndex(idx);
  };

  const toggleAutoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlay((prev) => !prev);
  };

  return (
    <section className="photo-card-container" aria-label="대표 명소 현장 사진 카드">
      <div
        className="photo-card"
        onMouseEnter={() => totalImages > 1 && setIsAutoPlay(false)}
        onMouseLeave={() => totalImages > 1 && setIsAutoPlay(true)}
      >
        {/* Background Image Container */}
        <div className="image-wrapper">
          {!imageLoaded && !imageErrors[currentIndex] && (
            <div className="image-skeleton">
              <ImageIcon className="skeleton-icon" size={32} />
              <span>공식 아카이브 사진 불러오는 중...</span>
            </div>
          )}

          <img
            key={`${poi.id}-${currentIndex}`}
            src={
              imageErrors[currentIndex]
                ? 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80'
                : currentImage.src
            }
            alt={currentImage.alt || poi.name}
            className={`poi-image ${imageLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageErrors((prev) => ({ ...prev, [currentIndex]: true }));
              setImageLoaded(true);
            }}
          />

          {/* Gradient Overlay */}
          <div className="image-overlay" />

          {/* Top Badges */}
          <div className="card-top-badges">
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="badge category-badge">{poi.category}</span>
              {totalImages > 1 && (
                <span className="badge counter-badge" style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  {currentIndex + 1} / {totalImages}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {totalImages > 1 && (
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  className="badge autoplay-badge"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px'
                  }}
                  title={isAutoPlay ? '슬라이드쇼 일시정지' : '슬라이드쇼 재생'}
                >
                  {isAutoPlay ? <Pause size={12} /> : <Play size={12} />}
                  <span style={{ fontSize: '10px' }}>{isAutoPlay ? '자동' : '정지'}</span>
                </button>
              )}
              <span className="badge distance-badge">
                <MapPin size={12} />
                {distanceText}
              </span>
            </div>
          </div>

          {/* Slideshow Arrow Buttons (When multiple images exist) */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className="slide-arrow-btn prev-btn"
                onClick={handlePrev}
                aria-label="이전 사진 보기"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="slide-arrow-btn next-btn"
                onClick={handleNext}
                aria-label="다음 사진 보기"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Bottom Info Overlay */}
          <div className="card-bottom-info">
            <div className="poi-region">{poi.region}</div>
            <h2 className="poi-title">{poi.name}</h2>
            {currentImage.alt && currentImage.alt !== poi.name && (
              <div className="photo-subtitle" style={{
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '0.85rem',
                marginTop: '2px',
                marginBottom: '6px'
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

          {/* Dot Pagination Bullets */}
          {totalImages > 1 && (
            <div className="slideshow-dots" style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              display: 'flex',
              gap: '5px',
              zIndex: 3
            }}>
              {imageList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleSelectDot(idx, e)}
                  aria-label={`${idx + 1}번 사진으로 이동`}
                  style={{
                    width: idx === currentIndex ? '16px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: idx === currentIndex ? '#eb5e28' : 'rgba(255, 255, 255, 0.5)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Source Attribution Bar */}
        <div className="source-bar">
          <span className="source-label">
            📸 <strong>{currentImage.alt || poi.imageTitle || poi.name}</strong>
          </span>
          <span className="source-credit">
            출처: {currentImage.source || poi.imageSource || '한국학중앙연구원 한국향토문화전자대전'}
          </span>
        </div>
      </div>
    </section>
  );
};
