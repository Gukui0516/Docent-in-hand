import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  X,
  Trash2,
  Calendar,
  Search,
  History,
  MessageSquareHeart,
  MessageCircle,
  MapPin
} from 'lucide-react';
import { SavedStoryService, DateGroupedStories, SavedStoryItem } from '../services/savedStoryService';
import { VisitHistoryService, DateGroupedVisits, VisitRecord } from '../services/visitHistoryService';
import { MyCommentsService, DateGroupedComments, MyCommentItem } from '../services/myCommentsService';

interface SavedStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSavedPOI: (poiId: string) => void;
  currentPOIId?: string;
}

type TabType = 'bookmarks' | 'history' | 'comments';

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

  // Visit history state
  const [visitGroups, setVisitGroups] = useState<DateGroupedVisits[]>([]);
  const [visitSearchQuery, setVisitSearchQuery] = useState('');
  const [visitCount, setVisitCount] = useState(0);

  // My comments state
  const [commentGroups, setCommentGroups] = useState<DateGroupedComments[]>([]);
  const [commentSearchQuery, setCommentSearchQuery] = useState('');
  const [commentCount, setCommentCount] = useState(0);

  const refreshData = () => {
    // Refresh bookmarks
    const bGroups = SavedStoryService.getGroupedStories();
    setSavedGroups(bGroups);
    const bCount = bGroups.reduce((acc, g) => acc + g.items.length, 0);
    setBookmarkCount(bCount);

    // Refresh visit history
    const vGroups = VisitHistoryService.getGroupedVisits();
    setVisitGroups(vGroups);
    const vCount = vGroups.reduce((acc, g) => acc + g.records.length, 0);
    setVisitCount(vCount);

    // Refresh my comments
    const cGroups = MyCommentsService.getGroupedComments();
    setCommentGroups(cGroups);
    const cCount = cGroups.reduce((acc, g) => acc + g.items.length, 0);
    setCommentCount(cCount);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setBookmarkSearchQuery('');
      setVisitSearchQuery('');
      setCommentSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemoveBookmark = (e: React.MouseEvent, poiId: string) => {
    e.stopPropagation();
    SavedStoryService.removeStory(poiId);
    refreshData();
  };

  const handleRemoveVisit = (e: React.MouseEvent, poiId: string) => {
    e.stopPropagation();
    VisitHistoryService.removeVisit(poiId);
    refreshData();
  };

  const handleRemoveComment = (e: React.MouseEvent, commentId: string) => {
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

  // Filter visit history by search query
  const filteredVisitGroups = visitGroups
    .map((group) => {
      const filteredItems = group.records.filter(
        (item) =>
          item.name.toLowerCase().includes(visitSearchQuery.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(visitSearchQuery.toLowerCase())) ||
          (item.region && item.region.toLowerCase().includes(visitSearchQuery.toLowerCase())) ||
          (item.summary && item.summary.toLowerCase().includes(visitSearchQuery.toLowerCase()))
      );
      return {
        ...group,
        records: filteredItems
      };
    })
    .filter((group) => group.records.length > 0);

  // Filter comments by search query
  const filteredCommentGroups = commentGroups
    .map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.poiName.toLowerCase().includes(commentSearchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(commentSearchQuery.toLowerCase()) ||
          item.authorName.toLowerCase().includes(commentSearchQuery.toLowerCase())
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
                ) : activeTab === 'history' ? (
                  <>
                    탐방 기록 <span className="saved-count-pill history-pill">{visitCount}</span>
                  </>
                ) : (
                  <>
                    내가 쓴 댓글 <span className="saved-count-pill comment-pill">{commentCount}</span>
                  </>
                )}
              </h2>
              <p className="saved-header-desc">
                {activeTab === 'bookmarks'
                  ? '더 읽고 싶은 제주의 이야기'
                  : activeTab === 'history'
                  ? '시간 순서대로 기록된 제주의 발자취'
                  : '제주 명소에 남긴 나의 이야기와 추억'}
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

        {/* 3-Tab Segment Switcher */}
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
            aria-selected={activeTab === 'history'}
            className={`modal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={15} />
            <span>탐방 기록 ({visitCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'comments'}
            className={`modal-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <MessageSquareHeart size={15} />
            <span>내가 쓴 댓글 ({commentCount})</span>
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

        {/* Tab 2: Visit History Content (Exact same chronological card layout as Bookmarks) */}
        {activeTab === 'history' && (
          <>
            {/* Search Bar (if has items) */}
            {visitCount > 0 && (
              <div className="saved-search-wrapper">
                <Search size={16} className="saved-search-icon" />
                <input
                  type="text"
                  className="saved-search-input"
                  placeholder="탐방한 명소 이름, 분류, 지역 검색..."
                  value={visitSearchQuery}
                  onChange={(e) => setVisitSearchQuery(e.target.value)}
                />
                {visitSearchQuery && (
                  <button
                    type="button"
                    className="saved-search-clear"
                    onClick={() => setVisitSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="saved-modal-body">
              {visitCount === 0 ? (
                <div className="saved-empty-state">
                  <div className="empty-icon-circle history-circle">
                    <History size={36} className="empty-history-icon" />
                  </div>
                  <h3 className="empty-title">아직 탐방 기록이 없습니다</h3>
                  <p className="empty-desc">
                    제주 곳곳의 명소를 둘러보면,
                    <br />
                    다녀온 시간 순서대로 이곳에 자동으로 발자취가 기록됩니다.
                  </p>
                </div>
              ) : filteredVisitGroups.length === 0 ? (
                <div className="saved-empty-state">
                  <p className="empty-desc">검색어와 일치하는 탐방 명소가 없습니다.</p>
                </div>
              ) : (
                <div className="saved-timeline">
                  {filteredVisitGroups.map((group) => (
                    <div key={group.dateKey} className="saved-date-group">
                      <div className="saved-date-header">
                        <Calendar size={14} className="date-icon" />
                        <span>{group.dateLabel}</span>
                        <span className="date-item-count">{group.records.length}곳 방문</span>
                      </div>

                      <div className="saved-items-grid">
                        {group.records.map((record: VisitRecord) => {
                          const timeString = new Date(record.visitedAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <article
                              key={record.id}
                              className="saved-story-card"
                              onClick={() => handleItemClick(record.id)}
                            >
                              <div className="saved-card-thumb-wrapper">
                                {record.imageUrl ? (
                                  <img
                                    src={record.imageUrl}
                                    alt={record.name}
                                    className="saved-card-thumb"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="saved-card-thumb-placeholder">
                                    <MapPin size={24} />
                                  </div>
                                )}
                                <div className="saved-card-time-badge">{timeString}</div>
                              </div>

                              <div className="saved-card-content">
                                <div className="saved-card-header-row">
                                  <h4 className="saved-poi-name">「{record.name}」</h4>
                                  <button
                                    type="button"
                                    className="saved-card-delete-btn"
                                    onClick={(e) => handleRemoveVisit(e, record.id)}
                                    title="탐방 기록 삭제"
                                    aria-label={`${record.name} 탐방 기록 삭제`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <p className="saved-card-snippet">
                                  {record.summary || `${record.name} - 제주의 역사와 문화가 깃든 명소 탐방`}
                                </p>

                                <div className="saved-card-footer">
                                  <div className="saved-card-tags">
                                    {record.category && (
                                      <span className="saved-tag-pill">#{record.category}</span>
                                    )}
                                    {record.region && (
                                      <span className="saved-tag-pill">
                                        #{record.region.split(' ')[0]}
                                      </span>
                                    )}
                                    <span className="saved-tag-pill">#탐방완료</span>
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

        {/* Tab 3: My Comments (내가 쓴 댓글) */}
        {activeTab === 'comments' && (
          <>
            {/* Search Bar (if has items) */}
            {commentCount > 0 && (
              <div className="saved-search-wrapper">
                <Search size={16} className="saved-search-icon" />
                <input
                  type="text"
                  className="saved-search-input"
                  placeholder="내가 쓴 댓글 내용, 명소 이름 검색..."
                  value={commentSearchQuery}
                  onChange={(e) => setCommentSearchQuery(e.target.value)}
                />
                {commentSearchQuery && (
                  <button
                    type="button"
                    className="saved-search-clear"
                    onClick={() => setCommentSearchQuery('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="saved-modal-body">
              {commentCount === 0 ? (
                <div className="saved-empty-state">
                  <div className="empty-icon-circle comment-circle">
                    <MessageCircle size={36} className="empty-comment-icon" />
                  </div>
                  <h3 className="empty-title">아직 남긴 댓글이 없습니다</h3>
                  <p className="empty-desc">
                    명소 카드의 <strong>[우리의 제주 이야기]</strong>에서 나만의 추억과 이야기를 남겨보세요.
                    <br />
                    내가 쓴 모든 글이 이곳에 시간순으로 모입니다.
                  </p>
                </div>
              ) : filteredCommentGroups.length === 0 ? (
                <div className="saved-empty-state">
                  <p className="empty-desc">검색어와 일치하는 댓글이 없습니다.</p>
                </div>
              ) : (
                <div className="saved-timeline">
                  {filteredCommentGroups.map((group) => (
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
                              className="saved-story-card my-comment-card"
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
                                    onClick={(e) => handleRemoveComment(e, item.id)}
                                    title="댓글 삭제"
                                    aria-label={`${item.poiName} 댓글 삭제`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="my-comment-author-badge">
                                  <span>✍️ {item.authorName}</span>
                                </div>

                                <p className="saved-card-snippet my-comment-content">
                                  {item.content}
                                </p>

                                <div className="saved-card-footer">
                                  <div className="saved-card-tags">
                                    {item.category && (
                                      <span className="saved-tag-pill">#{item.category}</span>
                                    )}
                                    <span className="saved-tag-pill">#나의기록</span>
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
