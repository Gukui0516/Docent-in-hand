import React, { useState, useEffect } from 'react';
import { POI } from '../types/docent';
import { INITIAL_COMMUNITY_STORIES, UserCommunityStory } from '../data/communityStories';
import { CommunityArchiveModal } from './CommunityArchiveModal';
import { Heart, PlusCircle, BookHeart, ChevronDown, ChevronUp } from 'lucide-react';

interface UserArchiveSectionProps {
  poi: POI;
}

export const UserArchiveSection: React.FC<UserArchiveSectionProps> = ({ poi }) => {
  const [stories, setStories] = useState<UserCommunityStory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(1);

  // Load community stories from localStorage + INITIAL_COMMUNITY_STORIES
  useEffect(() => {
    const savedCustomStories: UserCommunityStory[] = JSON.parse(
      localStorage.getItem('docent_community_stories') || '[]'
    );

    const allStories = [...savedCustomStories, ...INITIAL_COMMUNITY_STORIES];
    const poiStories = allStories.filter((story) => story.poiId === poi.id);

    setStories(poiStories);
    setVisibleCount(1);
  }, [poi.id]);

  const handleAddStory = (newStory: UserCommunityStory) => {
    const savedCustomStories: UserCommunityStory[] = JSON.parse(
      localStorage.getItem('docent_community_stories') || '[]'
    );

    const updatedCustom = [newStory, ...savedCustomStories];
    localStorage.setItem('docent_community_stories', JSON.stringify(updatedCustom));

    setStories((prev) => [newStory, ...prev]);
  };

  // Toggle Like: add like (+1) or remove like (-1)
  const handleLike = (storyId: string) => {
    const isCurrentlyLiked = !!likedMap[storyId];

    setLikedMap((prev) => ({
      ...prev,
      [storyId]: !isCurrentlyLiked
    }));

    setStories((prev) =>
      prev.map((item) => {
        if (item.id === storyId) {
          const newLikes = isCurrentlyLiked ? Math.max(0, item.likes - 1) : item.likes + 1;
          return { ...item, likes: newLikes };
        }
        return item;
      })
    );
  };

  // Sort stories strictly by likes descending (most liked story first)
  const sortedStories = [...stories].sort((a, b) => b.likes - a.likes);
  const displayedStories = sortedStories.slice(0, visibleCount);

  const hasMore = visibleCount < sortedStories.length;
  const remainingCount = sortedStories.length - visibleCount;

  const handleToggleMore = () => {
    if (hasMore) {
      setVisibleCount((prev) => prev + 3);
    } else {
      setVisibleCount(1);
    }
  };

  return (
    <section className="user-archive-section-container" aria-label="우리의 제주 이야기">
      <div className="compact-archive-card">
        {/* Compact Header Bar */}
        <div className="compact-archive-header">
          <div className="compact-title-group">
            <h3 className="compact-archive-title">
              <BookHeart size={16} className="title-icon" />
              <span>우리의 제주 이야기</span>
              <span className="compact-count-badge">{stories.length}</span>
            </h3>
          </div>

          <button
            type="button"
            className="compact-write-btn"
            onClick={() => setIsModalOpen(true)}
            title="이야기 남기기"
          >
            <PlusCircle size={13} />
            <span>기록하기</span>
          </button>
        </div>

        {/* Stories List (Sorted by Most Liked, Expanded 3 at a time) */}
        {sortedStories.length > 0 && (
          <div className="compact-stories-feed">
            {displayedStories.map((story) => (
              <article key={story.id} className="compact-item-card">
                <div className="compact-card-top">
                  <div className="author-info">
                    <span className="author-name">{story.authorName}</span>
                  </div>
                  <span className="created-date">{story.createdAt}</span>
                </div>

                <p className="compact-story-text">{story.content}</p>

                {story.imageUrl && (
                  <div className="compact-story-image">
                    <img src={story.imageUrl} alt="추억 사진" loading="lazy" />
                  </div>
                )}

                <div className="compact-card-bottom">
                  <button
                    type="button"
                    className={`compact-like-btn ${likedMap[story.id] ? 'liked' : ''}`}
                    onClick={() => handleLike(story.id)}
                  >
                    <Heart size={12} className={likedMap[story.id] ? 'fill-heart' : ''} />
                    <span>공감 {story.likes}</span>
                  </button>
                </div>
              </article>
            ))}

            {/* Pagination Button: Expands 3 stories at a time */}
            {sortedStories.length > 1 && (
              <button
                type="button"
                className="toggle-all-stories-btn"
                onClick={handleToggleMore}
              >
                <span>
                  {hasMore
                    ? `전체보기 (${Math.min(3, remainingCount)}개 더보기)`
                    : '접기'}
                </span>
                {hasMore ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Story Write Modal */}
      <CommunityArchiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        poi={poi}
        onSubmitStory={handleAddStory}
      />
    </section>
  );
};
