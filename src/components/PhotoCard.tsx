import React, { useState, useEffect, useRef } from 'react';
import { POI, POIImage } from '../types/docent';
import { MapPin, Image as ImageIcon, ChevronLeft, ChevronRight, Play, Pause, ExternalLink, Maximize2, X } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ poi, distanceText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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

  const handleSelectDot = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx === currentIndex) return;
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="badge fullscreen-btn"
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
                title="사진 원본 크게 보기"
                aria-label="사진 원본 크게 보기"
              >
                <Maximize2 size={12} />
                <span style={{ fontSize: '10px' }}>확대</span>
              </button>
            </div>
          </div>

          {/* Slideshow Directional Arrow Buttons */}
          {totalImages > 1 && (
            <>
              <button
                type="button"
                className="slide-arrow-btn prev-btn"
                onClick={handlePrev}
                title="이전 사진 (오른쪽으로 슬라이드)"
                aria-label="이전 사진 보기"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="slide-arrow-btn next-btn"
                onClick={handleNext}
                title="다음 사진 (왼쪽으로 슬라이드)"
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

          {/* Interactive Dot Pagination Bullets */}
          {totalImages > 1 && (
            <div className="slideshow-dots" style={{
              position: 'absolute',
              bottom: '10px',
              right: '14px',
              display: 'flex',
              gap: '6px',
              zIndex: 3
            }}>
              {imageList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleSelectDot(idx, e)}
                  aria-label={`${idx + 1}번 사진으로 이동`}
                  style={{
                    width: idx === currentIndex ? '18px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: idx === currentIndex ? '#eb5e28' : 'rgba(255, 255, 255, 0.55)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Source Attribution Bar with Clickable Archive Link */}
        <div className="source-bar">
          <span className="source-label">
            📸 <strong>{currentImage.alt || poi.imageTitle || poi.name}</strong>
          </span>
          {currentImage.sourceUrl || poi.sourceUrl || poi.id ? (
            <a
              href={currentImage.sourceUrl || poi.sourceUrl || `https://jeju.grandculture.net/jeju/toc/${poi.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="source-credit-link"
              title="한국학중앙연구원 향토문화전자대전 공식 아카이브 원문 페이지 열기"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#2b2d42',
                textDecoration: 'none',
                backgroundColor: 'rgba(235, 94, 40, 0.08)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(235, 94, 40, 0.25)',
                fontWeight: 600,
                fontSize: '11px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(235, 94, 40, 0.18)';
                e.currentTarget.style.borderColor = '#eb5e28';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(235, 94, 40, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(235, 94, 40, 0.25)';
              }}
            >
              <span>출처: {currentImage.source || poi.imageSource || '한국학중앙연구원 한국향토문화전자대전'}</span>
              <ExternalLink size={12} color="#eb5e28" />
            </a>
          ) : (
            <span className="source-credit">
              출처: {currentImage.source || poi.imageSource || '한국학중앙연구원 한국향토문화전자대전'}
            </span>
          )}
        </div>
      </div>

      {/* Fullscreen High-Resolution Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="modal-backdrop photo-lightbox-backdrop"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="photo-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="닫기"
            >
              <X size={24} />
            </button>

            <div className="lightbox-image-container">
              <img
                src={currentImage.src}
                alt={currentImage.alt || poi.name}
                className="lightbox-img"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="lightbox-caption">
              <div className="lightbox-title-row">
                <h3>{poi.name}</h3>
                <span className="lightbox-badge">{poi.category} · {poi.region}</span>
              </div>
              {currentImage.alt && (
                <p className="lightbox-alt">📷 {currentImage.alt}</p>
              )}
              <div className="lightbox-source-info">
                출처: {currentImage.source || poi.imageSource || '한국학중앙연구원 한국향토문화전자대전'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
