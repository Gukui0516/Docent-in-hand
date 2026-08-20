import React, { useState } from 'react';
import { POI } from '../types/docent';
import { MapPin, Image as ImageIcon } from 'lucide-react';

interface PhotoCardProps {
  poi: POI;
  distanceText: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ poi, distanceText }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <section className="photo-card-container" aria-label="대표 명소 현장 사진 카드">
      <div className="photo-card">
        {/* Background Image Container */}
        <div className="image-wrapper">
          {!imageLoaded && !imageError && (
            <div className="image-skeleton">
              <ImageIcon className="skeleton-icon" size={32} />
              <span>공식 아카이브 사진 불러오는 중...</span>
            </div>
          )}

          <img
            src={imageError ? 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80' : poi.imageUrl}
            alt={poi.imageTitle || poi.name}
            className={`poi-image ${imageLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />

          {/* Gradient Overlay */}
          <div className="image-overlay" />

          {/* Top Badges */}
          <div className="card-top-badges">
            <span className="badge category-badge">{poi.category}</span>
            <span className="badge distance-badge">
              <MapPin size={12} />
              {distanceText}
            </span>
          </div>

          {/* Bottom Info Overlay */}
          <div className="card-bottom-info">
            <div className="poi-region">{poi.region}</div>
            <h2 className="poi-title">{poi.name}</h2>
            <div className="tag-list">
              {poi.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="poi-tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Source Attribution Bar */}
        <div className="source-bar">
          <span className="source-label">
            📸 <strong>{poi.imageTitle || poi.name}</strong>
          </span>
          <span className="source-credit">
            출처: {poi.imageSource}
          </span>
        </div>
      </div>
    </section>
  );
};
