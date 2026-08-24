import React, { useEffect, useMemo, useRef, useState } from 'react';
import { POICard, POISummary } from '../types/docent';
import { loadPOICards } from '../services/poiDataService';
import { calculateDistanceMeters, formatDistance } from '../utils/geo';
import { X, MapPin, Search, Navigation } from 'lucide-react';
import { KakaoPOIMap } from './KakaoPOIMap';

interface POICarouselProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPOIId: string;
  /** 부팅 시 받아 둔 슬림 인덱스(gzip 62KB). 정렬·필터는 전부 이 배열 위에서 돈다. */
  pois: POISummary[];
  onSelectPOI: (poi: POISummary, distMeters?: number) => void;
  userLocation: { lat: number; lng: number };
}

const FALLBACK_THUMBNAIL = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=300&q=80';

export const POICarousel: React.FC<POICarouselProps> = ({
  isOpen,
  onClose,
  selectedPOIId,
  pois,
  onSelectPOI,
  userLocation
}) => {
  const PAGE_SIZE = 40;
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [cards, setCards] = useState<Record<string, POICard>>({});
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

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    loadPOICards()
      .then((loaded) => { if (!cancelled) setCards(loaded); })
      .catch((err) => console.warn('POI 카드 로드 실패:', err));
    return () => { cancelled = true; };
  }, [isOpen]);

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

  // Calculate distances for all POIs and sort by proximity
  const sortedPOIsWithDistance = useMemo(() => {
    return pois.map((poi) => {
      const distMeters = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        poi.latitude,
        poi.longitude
      );
      return { poi, distMeters };
    }).sort((a, b) => a.distMeters - b.distMeters);
  }, [pois, userLocation]);

  // Deep search logic across name, region, tags, mythTitle, summary, details, and sampleQuestions
  const filteredList = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedPOIsWithDistance.filter(({ poi }) => {
      let matchCat = true;
      if (filterCategory !== 'all') {
        matchCat = poi.category === filterCategory;
      }

      if (!normalizedQuery) return matchCat;

      // 인덱스에 있는 필드 + 카드에 실려 온 필드까지 검색한다.
      // mythAndFact.details(원문 본문)는 카드에 넣지 않았으므로 대상이 아니다 —
      // 그 필드 하나가 카드 전송량을 gzip 329KB → 1.5MB 로 불린다.
      const card = cards[poi.id];
      const matchName = poi.name.toLowerCase().includes(normalizedQuery);
      const matchRegion = poi.region.toLowerCase().includes(normalizedQuery);
      const matchTags = poi.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchMythTitle = card?.mythTitle
        ? card.mythTitle.toLowerCase().includes(normalizedQuery)
        : false;
      const matchSummary = card?.summary
        ? card.summary.toLowerCase().includes(normalizedQuery)
        : false;
      const matchQuestions = card?.sampleQuestions
        ? card.sampleQuestions.some((q) => q.toLowerCase().includes(normalizedQuery))
        : false;

      const matchSearch =
        matchName ||
        matchRegion ||
        matchTags ||
        matchMythTitle ||
        matchSummary ||
        matchQuestions;

      return matchCat && matchSearch;
    });
  }, [filterCategory, searchQuery, sortedPOIsWithDistance, cards]);

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
        {/* Inline Search Header with Close Button */}
        <div className="compact-search-header">
          <div className="modal-search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Kakao Map - GPS 1km Radius & Category-filtered Exploration */}
        <KakaoPOIMap
          userLocation={userLocation}
          pois={pois}
          selectedCategory={filterCategory}
          selectedPOIId={selectedPOIId}
          onSelectPOI={(poi, dist) => {
            onSelectPOI(poi, dist);
            onClose();
          }}
          searchQuery={searchQuery}
        />

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
          {visibleList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#777', fontSize: '13px' }}>
              검색 키워드에 해당하는 명소나 이야기를 찾지 못했습니다. 다른 단어로 검색해보세요!
            </div>
          ) : (
            visibleList.map(({ poi, distMeters }) => {
              const isSelected = poi.id === selectedPOIId;

              return (
                <div
                  key={poi.id}
                  className={`poi-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectPOI(poi, distMeters);
                    onClose();
                  }}
                >
                  <div className="item-thumbnail-wrapper">
                    <img
                      src={cards[poi.id]?.imageUrl || FALLBACK_THUMBNAIL}
                      alt={poi.name}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="item-thumbnail"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_THUMBNAIL;
                      }}
                    />
                  </div>

                  <div className="item-info">
                    <div className="item-region">
                      <MapPin size={11} />
                      {poi.region}
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#00695C' }}>
                        <Navigation size={10} style={{ display: 'inline', marginRight: '2px' }} />
                        {formatDistance(distMeters)}
                      </span>
                    </div>
                    <h4 className="item-name">{poi.name}</h4>
                    <p className="item-summary">{cards[poi.id]?.summary ?? ''}</p>
                  </div>
                </div>
              );
            })
          )}
          {visibleCount < filteredList.length && (
            <div className="poi-load-sentinel" ref={loadSentinelRef} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
};
