import React, { useEffect, useMemo, useState } from 'react';
import { POI } from '../types/docent';
import { POI_LIST } from '../data/poiData';
import { CHARACTERS } from '../data/characters';
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
    { id: 'all', label: `전체 (${POI_LIST.length})` },
    { id: '자연과 지리', label: '🌋 자연과 지리' },
    { id: '역사', label: '📜 역사' },
    { id: '문화유산', label: '🗿 문화유산' },
    { id: '성씨와 인물', label: '👑 성씨와 인물' },
    { id: '정치·경제·사회', label: '🏛️ 정치·경제·사회' },
    { id: '종교', label: '⛩️ 종교' },
    { id: '생활과 민속', label: '🤿 생활과 민속' },
    { id: '문화와 교육', label: '🎨 문화와 교육' },
    { id: '언어와 문학', label: '📖 언어와 문학' },
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

  if (!shouldRender) return null;

  return (
    <div className={`modal-backdrop poi-explorer-backdrop ${isClosing ? 'closing' : ''}`} onClick={onClose}>
      <div className="modal-sheet poi-explorer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>제주 신화 & 명소 둘러보기</h3>
            <p>원하는 장소를 선택하면 도슨트와 스토리가 즉시 전환됩니다.</p>
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

        {/* Category Tabs (9 Official Domains) */}
        <div className="category-tabs">
          {categories.map((cat) => {
            const count = cat.id === 'all' 
              ? POI_LIST.length 
              : POI_LIST.filter(p => p.category === cat.id).length;
            
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-tab-btn ${filterCategory === cat.id ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat.id)}
              >
                {cat.id === 'all' ? cat.label : `${cat.label} (${count})`}
              </button>
            );
          })}
        </div>

        {/* POI Grid/List */}
        <div className="poi-items-list">
          {visibleList.map((poi) => {
            const character = CHARACTERS[poi.assignedCharacterId] || CHARACTERS.docent;
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
                  <span className="item-char-pill">
                    {character.avatarEmoji} {character.name}
                  </span>
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
            <button
              type="button"
              className="poi-load-more"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              장소 더 보기
              <span>{Math.min(visibleCount, filteredList.length).toLocaleString()} / {filteredList.length.toLocaleString()}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
