import React, { useState, useEffect } from 'react';
import { POI } from '../types/docent';
import { UserCommunityStory } from '../data/communityStories';
import { CommunityArchiveModal } from './CommunityArchiveModal';
import { CommunityStoryClient } from '../services/communityStoryClient';
import { Heart, PlusCircle, BookHeart, ChevronDown, ChevronUp } from 'lucide-react';

interface UserArchiveSectionProps {
  poi: POI;
}

export const UserArchiveSection: React.FC<UserArchiveSectionProps> = ({ poi }) => {
  const [stories, setStories] = useState<UserCommunityStory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Load liked stories from localStorage
  useEffect(() => {
    try {
      const savedLikes = JSON.parse(localStorage.getItem('docent_liked_story_ids') || '{}');
      setLikedMap(savedLikes);
    } catch {
      setLikedMap({});
    }
  }, []);

  // Fetch all community stories from central server for this POI
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    CommunityStoryClient.fetchStoriesByPOI(poi.id).then((poiStories) => {
      if (!isCancelled) {
        setStories(poiStories);
        setVisibleCount(1);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [poi.id]);

  const handleAddStory = (newStory: UserCommunityStory) => {
    setStories((prev) => {
      const filtered = prev.filter((s) => s.id !== newStory.id);
      return [newStory, ...filtered];
    });
  };

  // Toggle Like: add like (+1) or remove like (-1) & sync with server
  const handleLike = async (storyId: string) => {
    const isCurrentlyLiked = !!likedMap[storyId];
    const willBeLiked = !isCurrentlyLiked;

    const newLikedMap = {
      ...likedMap,
      [storyId]: willBeLiked
    };
    setLikedMap(newLikedMap);
    try {
      localStorage.setItem('docent_liked_story_ids', JSON.stringify(newLikedMap));
    } catch {
      // ignore
    }

    // Optimistic UI update
    setStories((prev) =>
      prev.map((item) => {
        if (item.id === storyId) {
          const newLikes = willBeLiked ? item.likes + 1 : Math.max(0, item.likes - 1);
          return { ...item, likes: newLikes };
        }
        return item;
      })
    );

    // Sync to backend server
    const serverLikes = await CommunityStoryClient.toggleLike(storyId, willBeLiked);
    if (serverLikes !== null) {
      setStories((prev) =>
        prev.map((item) => (item.id === storyId ? { ...item, likes: serverLikes } : item))
      );
    }
  };

  // Sort stories strictly by likes descending (most liked story first)
  const sortedStories = [...stories].sort((a, b) => b.likes - a.likes || b.createdAt.localeCompare(a.createdAt));
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

        {isLoading && sortedStories.length === 0 && (
          <p className="compact-stories-loading" style={{ fontSize: '12px', color: '#777', padding: '8px 0' }}>
            이웃들의 이야기를 불러오는 중…
          </p>
        )}

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
