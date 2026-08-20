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
    { id: 'all', label: '전체 (11)' },
    { id: '자연과 지리', label: '🌋 자연과 지리' },
    { id: '생활과 민속', label: '🤿 생활과 민속' },
    { id: '문화유산', label: '🗿 문화유산' },
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
                  <img src={poi.imageUrl} alt={poi.name} className="item-thumbnail" />
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
