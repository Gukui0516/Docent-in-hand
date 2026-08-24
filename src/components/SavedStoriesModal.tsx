import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  X,
  Trash2,
  Calendar,
  Search,
  MessageSquareHeart,
  BookOpen
} from 'lucide-react';
import { SavedStoryService, DateGroupedStories, SavedStoryItem } from '../services/savedStoryService';
import { MyCommentsService, DateGroupedComments, MyCommentItem } from '../services/myCommentsService';

interface SavedStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSavedPOI: (poiId: string) => void;
  currentPOIId?: string;
}

type TabType = 'bookmarks' | 'stories';

export const SavedStoriesModal: React.FC<SavedStoriesModalProps> = ({
  isOpen,
  onClose,
  onSelectSavedPOI
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('bookmarks');

  // Bookmarks state
  const [savedGroups, setSavedGroups] = useState<DateGroupedStories[]>([]);
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [bookmarkCount, setBookmarkCount] = useState(0);

  // My Stories state
  const [storyGroups, setStoryGroups] = useState<DateGroupedComments[]>([]);
  const [storySearchQuery, setStorySearchQuery] = useState('');
  const [storyCount, setStoryCount] = useState(0);

  const refreshData = () => {
    // Refresh bookmarks
    const bGroups = SavedStoryService.getGroupedStories();
    setSavedGroups(bGroups);
    const bCount = bGroups.reduce((acc, g) => acc + g.items.length, 0);
    setBookmarkCount(bCount);

    // Refresh my stories
    const sGroups = MyCommentsService.getGroupedComments();
    setStoryGroups(sGroups);
    const sCount = sGroups.reduce((acc, g) => acc + g.items.length, 0);
    setStoryCount(sCount);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setBookmarkSearchQuery('');
      setStorySearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemoveBookmark = (e: React.MouseEvent, poiId: string) => {
    e.stopPropagation();
    SavedStoryService.removeStory(poiId);
    refreshData();
  };

  const handleRemoveStory = (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    MyCommentsService.removeComment(commentId);
    refreshData();
  };

  const handleItemClick = (poiId: string) => {
    onSelectSavedPOI(poiId);
    onClose();
  };

  // Filter bookmarks by search query
  const filteredBookmarkGroups = savedGroups
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.poiName.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(bookmarkSearchQuery.toLowerCase())) ||
          item.storyText.toLowerCase().includes(bookmarkSearchQuery.toLowerCase())
      );
      return {
        ...group,
        items: filteredItems
      };
    })
    .filter((group) => group.items.length > 0);

  // Filter my stories by search query
  const filteredStoryGroups = storyGroups
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.poiName.toLowerCase().includes(storySearchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(storySearchQuery.toLowerCase()) ||
          item.authorName.toLowerCase().includes(storySearchQuery.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(storySearchQuery.toLowerCase()))
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
                {activeTab === 'bookmarks' ? (
                  <>
                    북마크 <span className="saved-count-pill">{bookmarkCount}</span>
                  </>
                ) : (
                  <>
                    내가 쓴 이야기 <span className="saved-count-pill story-pill">{storyCount}</span>
                  </>
                )}
              </h2>
              <p className="saved-header-desc">
                {activeTab === 'bookmarks'
                  ? '더 읽고 싶은 제주의 이야기'
                  : '제주 명소에 기록한 나만의 이야기와 추억'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="saved-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2-Tab Segment Switcher */}
        <div className="modal-tab-segment" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bookmarks'}
            className={`modal-tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <Bookmark size={15} />
            <span>북마크 ({bookmarkCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stories'}
            className={`modal-tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            <MessageSquareHeart size={15} />
            <span>내가 쓴 이야기 ({storyCount})</span>
          </button>
        </div>

        {/* Tab 1: Bookmarks Content */}
        {activeTab === 'bookmarks' && (
          <>
            {/* Search Bar (if has items) */}
            {bookmarkCount > 0 && (
              <div className="saved-search-wrapper">
                <Search size={16} className="saved-search-icon" />
                <input
                  type="text"
                  className="saved-search-input"
                  placeholder="저장된 명소 이름, 태그, 키워드 검색..."
                  value={bookmarkSearchQuery}
                  onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                />
                {bookmarkSearchQuery && (
                  <button
                    type="button"
                    className="saved-search-clear"
                    onClick={() => setBookmarkSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="saved-modal-body">
              {bookmarkCount === 0 ? (
                <div className="saved-empty-state">
                  <div className="empty-icon-circle">
                    <Bookmark size={36} className="empty-bookmark-icon" />
                  </div>
                  <h3 className="empty-title">아직 북마크된 명소가 없습니다</h3>
                  <p className="empty-desc">
                    여행 중 도슨트 해설 카드의 <strong>북마크 아이콘</strong>을 누르면,
                    <br />
                    숙소나 이동 중에 편하게 읽을 수 있도록 이곳에 보관됩니다.
                  </p>
                </div>
              ) : filteredBookmarkGroups.length === 0 ? (
                <div className="saved-empty-state">
                  <p className="empty-desc">검색어와 일치하는 명소가 없습니다.</p>
                </div>
              ) : (
                <div className="saved-timeline">
                  {filteredBookmarkGroups.map((group) => (
                    <div key={group.dateKey} className="saved-date-group">
                      <div className="saved-date-header">
                        <Calendar size={14} className="date-icon" />
                        <span>{group.dateLabel}</span>
                        <span className="date-item-count">{group.items.length}개 보관</span>
                      </div>

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
                                  <h4 className="saved-poi-name">「{item.poiName}」</h4>
                                  <button
                                    type="button"
                                    className="saved-card-delete-btn"
                                    onClick={(e) => handleRemoveBookmark(e, item.poiId)}
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
          </>
        )}

        {/* Tab 2: My Written Stories (내가 쓴 이야기) */}
        {activeTab === 'stories' && (
          <>
            {/* Search Bar (if has items) */}
            {storyCount > 0 && (
              <div className="saved-search-wrapper">
                <Search size={16} className="saved-search-icon" />
                <input
                  type="text"
                  className="saved-search-input"
                  placeholder="내가 쓴 이야기 내용, 명소 이름 검색..."
                  value={storySearchQuery}
                  onChange={(e) => setStorySearchQuery(e.target.value)}
                />
                {storySearchQuery && (
                  <button
                    type="button"
                    className="saved-search-clear"
                    onClick={() => setStorySearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="saved-modal-body">
              {storyCount === 0 ? (
                <div className="saved-empty-state">
                  <div className="empty-icon-circle story-circle">
                    <BookOpen size={36} className="empty-story-icon" />
                  </div>
                  <h3 className="empty-title">아직 작성한 이야기가 없습니다</h3>
                  <p className="empty-desc">
                    명소 카드의 <strong>[우리의 제주 이야기 &gt; 기록하기]</strong>에서
                    <br />
                    명소에 대한 나만의 추억과 이야기를 남겨보세요.
                  </p>
                </div>
              ) : filteredStoryGroups.length === 0 ? (
                <div className="saved-empty-state">
                  <p className="empty-desc">검색어와 일치하는 이야기가 없습니다.</p>
                </div>
              ) : (
                <div className="saved-timeline">
                  {filteredStoryGroups.map((group) => (
                    <div key={group.dateKey} className="saved-date-group">
                      <div className="saved-date-header">
                        <Calendar size={14} className="date-icon" />
                        <span>{group.dateLabel}</span>
                        <span className="date-item-count">{group.items.length}개 작성</span>
                      </div>

                      <div className="saved-items-grid">
                        {group.items.map((item: MyCommentItem) => {
                          return (
                            <article
                              key={item.id}
                              className="saved-story-card my-written-story-card"
                              onClick={() => handleItemClick(item.poiId)}
                            >
                              <div className="saved-card-thumb-wrapper">
                                {item.imageUrl || item.poiImageUrl ? (
                                  <img
                                    src={item.imageUrl || item.poiImageUrl}
                                    alt={item.poiName}
                                    className="saved-card-thumb"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="saved-card-thumb-placeholder">
                                    <MessageSquareHeart size={24} />
                                  </div>
                                )}
                                <div className="saved-card-time-badge">{item.createdAt}</div>
                              </div>

                              <div className="saved-card-content">
                                <div className="saved-card-header-row">
                                  <h4 className="saved-poi-name">「{item.poiName}」</h4>
                                  <button
                                    type="button"
                                    className="saved-card-delete-btn"
                                    onClick={(e) => handleRemoveStory(e, item.id)}
                                    title="이야기 삭제"
                                    aria-label={`${item.poiName} 이야기 삭제`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="my-comment-author-badge">
                                  <span>✍️ {item.authorName}</span>
                                </div>

                                {/* Displays the actual user-written story, NOT the default description */}
                                <p className="saved-card-snippet my-written-content">
                                  {item.content}
                                </p>

                                <div className="saved-card-footer">
                                  <div className="saved-card-tags">
                                    {item.category && (
                                      <span className="saved-tag-pill">#{item.category}</span>
                                    )}
                                    <span className="saved-tag-pill">#내가쓴이야기</span>
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
          </>
        )}
      </div>
    </div>
  );
};
