import React, { useEffect, useMemo, useRef, useState } from 'react';
import { POI } from '../types/docent';
import { POI_LIST } from '../data/poiData';
import { X, MapPin, Search } from 'lucide-react';

interface POICarouselProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPOIId: string;
  onSelectPOI: (poi: POI) => void;
}

export const POICarousel: React.FC<POICarouselProps> = ({
  isOpen,
  onClose,
  selectedPOIId,
  onSelectPOI
}) => {
  const PAGE_SIZE = 40;
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const loadSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      return;
    }

    if (!shouldRender) return;

    setIsClosing(true);
    const closeTimer = window.setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
    }, 500);

    return () => window.clearTimeout(closeTimer);
  }, [isOpen, shouldRender]);

  const categories = [
    { id: 'all', label: '전체' },
    { id: '관광지', label: '관광지' },
    { id: '문화유산', label: '문화유산' },
    { id: '설화', label: '설화' },
    { id: '인물', label: '인물' },
    { id: '음식', label: '음식' },
    { id: '축제', label: '축제' },
    { id: '교육', label: '교육' },
  ];

  const filteredList = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return POI_LIST.filter((poi) => {
      const matchCat = filterCategory === 'all' || poi.category === filterCategory;
      const matchSearch = !normalizedQuery ||
                          poi.name.toLowerCase().includes(normalizedQuery) ||
                          poi.region.toLowerCase().includes(normalizedQuery) ||
                          poi.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return matchCat && matchSearch;
    });
  }, [filterCategory, searchQuery]);

  const visibleList = filteredList.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterCategory, searchQuery, isOpen]);

  useEffect(() => {
    const listElement = listRef.current;
    const sentinelElement = loadSentinelRef.current;

    if (!shouldRender || !listElement || !sentinelElement || visibleCount >= filteredList.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredList.length));
        }
      },
      {
        root: listElement,
        rootMargin: '0px 0px 500px 0px',
        threshold: 0
      }
    );

    observer.observe(sentinelElement);
    return () => observer.disconnect();
  }, [filteredList.length, shouldRender, visibleCount]);

  if (!shouldRender) return null;

  return (
    <div className={`modal-backdrop poi-explorer-backdrop ${isClosing ? 'closing' : ''}`} onClick={onClose}>
      <div className="modal-sheet poi-explorer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>주변 탐색</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="modal-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="명소 이름, 지역, 키워드 검색 (예: 성산, 해녀, 폭포)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-tab-btn ${filterCategory === cat.id ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* POI Grid/List */}
        <div className="poi-items-list" ref={listRef}>
          {visibleList.map((poi) => {
            const isSelected = poi.id === selectedPOIId;

            return (
              <div
                key={poi.id}
                className={`poi-list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectPOI(poi);
                  onClose();
                }}
              >
                <div className="item-thumbnail-wrapper">
                  <img
                    src={poi.imageUrl}
                    alt={poi.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="item-thumbnail"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=300&q=80';
                    }}
                  />
                </div>

                <div className="item-info">
                  <div className="item-region">
                    <MapPin size={12} />
                    {poi.region}
                  </div>
                  <h4 className="item-name">{poi.name}</h4>
                  <p className="item-summary">{poi.mythAndFact.summary}</p>
                </div>
              </div>
            );
          })}
          {visibleCount < filteredList.length && (
            <div className="poi-load-sentinel" ref={loadSentinelRef} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};
