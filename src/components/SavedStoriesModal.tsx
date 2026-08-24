import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  X,
  Trash2,
  Calendar,
  Search
} from 'lucide-react';
import { SavedStoryService, DateGroupedStories, SavedStoryItem } from '../services/savedStoryService';

interface SavedStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSavedPOI: (poiId: string) => void;
}

export const SavedStoriesModal: React.FC<SavedStoriesModalProps> = ({
  isOpen,
  onClose,
  onSelectSavedPOI
}) => {
  const [groupedList, setGroupedList] = useState<DateGroupedStories[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const refreshList = () => {
    const groups = SavedStoryService.getGroupedStories();
    setGroupedList(groups);
    const count = groups.reduce((acc, g) => acc + g.items.length, 0);
    setTotalCount(count);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemove = (e: React.MouseEvent, poiId: string) => {
    e.stopPropagation();
    SavedStoryService.removeStory(poiId);
    refreshList();
  };

  const handleItemClick = (poiId: string) => {
    onSelectSavedPOI(poiId);
    onClose();
  };

  // Filter items by search query if any
  const filteredGroups = groupedList
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.poiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.storyText.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...group,
        items: filteredItems
      };
    })
    .filter((group) => group.items.length > 0);

  return (
    <div
      className="saved-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-modal-title"
    >
      <div className="saved-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="saved-modal-header">
          <div className="saved-header-title-area">
            <div>
              <h2 id="saved-modal-title" className="saved-header-title">
                북마크 <span className="saved-count-pill">{totalCount}</span>
              </h2>
              <p className="saved-header-desc">
                더 읽고 싶은 제주의 이야기
              </p>
            </div>
          </div>
          <button
            type="button"
            className="saved-close-btn"
            onClick={onClose}
            aria-label="북마크 닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar (if has items) */}
        {totalCount > 0 && (
          <div className="saved-search-wrapper">
            <Search size={16} className="saved-search-icon" />
            <input
              type="text"
              className="saved-search-input"
              placeholder="저장된 명소 이름, 태그, 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="saved-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="saved-modal-body">
          {totalCount === 0 ? (
            <div className="saved-empty-state">
              <div className="empty-icon-circle">
                <Bookmark size={36} className="empty-bookmark-icon" />
              </div>
              <h3 className="empty-title">아직 북마크된 명소가 없습니다</h3>
              <p className="empty-desc">
                여행 중 도슨트 해설 카드의 <strong>북마크 아이콘</strong>을 누르면,
                <br />
                숙소나 이동 중에 편하게 읽을 수 있도록 이곳에 날짜별로 보관됩니다.
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="saved-empty-state">
              <p className="empty-desc">검색어와 일치하는 명소가 없습니다.</p>
            </div>
          ) : (
            <div className="saved-timeline">
              {filteredGroups.map((group) => (
                <div key={group.dateKey} className="saved-date-group">
                  {/* Date Sticky Header */}
                  <div className="saved-date-header">
                    <Calendar size={14} className="date-icon" />
                    <span>{group.dateLabel}</span>
                    <span className="date-item-count">{group.items.length}개 보관</span>
                  </div>

                  {/* Stories Grid/List */}
                  <div className="saved-items-grid">
                    {group.items.map((item: SavedStoryItem) => {
                      const timeString = new Date(item.savedAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <article
                          key={item.poiId}
                          className="saved-story-card"
                          onClick={() => handleItemClick(item.poiId)}
                        >
                          <div className="saved-card-thumb-wrapper">
                            <img
                              src={item.thumbnailUrl}
                              alt={item.poiName}
                              className="saved-card-thumb"
                              loading="lazy"
                            />
                            <div className="saved-card-time-badge">{timeString}</div>
                          </div>

                          <div className="saved-card-content">
                            <div className="saved-card-header-row">
                              <h4 className="saved-poi-name">{item.poiName}</h4>
                              <button
                                type="button"
                                className="saved-card-delete-btn"
                                onClick={(e) => handleRemove(e, item.poiId)}
                                title="북마크 취소"
                                aria-label={`${item.poiName} 북마크 취소`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <p className="saved-card-snippet">{item.storyText}</p>

                            <div className="saved-card-footer">
                              <div className="saved-card-tags">
                                {item.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="saved-tag-pill">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
