import React, { useState } from 'react';
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
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

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

  const filteredList = POI_LIST.filter((poi) => {
    const matchCat = filterCategory === 'all' || poi.category === filterCategory;
    const matchSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        poi.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        poi.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
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
          {filteredList.map((poi) => {
            const character = CHARACTERS[poi.assignedCharacterId];
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
        </div>
      </div>
    </div>
  );
};
