import React, { useState, useEffect } from 'react';
import { POI } from '../types/docent';
import { BookOpen, Bookmark, Check } from 'lucide-react';
import { getThemeTitle } from '../utils/themeTitle';
import { SavedStoryService } from '../services/savedStoryService';

interface StoryCardProps {
  poi: POI;
  storyText: string;
  isStreaming: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  poi,
  storyText,
  isStreaming
}) => {
  // 학술 문서는 POI 상세 조각(poi/{id}.json)에 실려 온다. 아직 로딩 중이면 null.
  const ragDoc = poi.ragDocument;
  const themeTitle = getThemeTitle(poi, ragDoc || undefined);

  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsSaved(SavedStoryService.isSaved(poi.id));
  }, [poi.id]);

  const handleToggleSave = () => {
    const nextSavedState = SavedStoryService.toggleSave(poi, storyText, themeTitle);
    setIsSaved(nextSavedState);

    if (nextSavedState) {
      setToastMessage('저장되었습니다.');
    } else {
      setToastMessage('저장이 취소되었습니다.');
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Split story into readable narrative paragraphs
  const paragraphs = storyText.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const sourceUrl = ragDoc?.sourceUrl || poi.sourceUrl || `https://jeju.grandculture.net/jeju/toc/${poi.id}`;
  const academicSources = ragDoc?.academicReferences
    ?.map((source) => source.replace(/\s*\(항목\s*ID\s*:\s*[^)]+\)/gi, ''))
    .join(', ') || '한국향토문화전자대전 (한국학중앙연구원)';

  return (
    <section className="story-card-container" aria-label="핵심 요약 리포트">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="saved-toast-banner" role="status">
          <div className="toast-content">
            <Check size={14} className="toast-icon-check" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Speech Bubble Card */}
      <div className="speech-bubble-card deep-story-card">
        {/* Story Header Row with Theme Title and Bookmark Action */}
        <div className="story-card-header-bar">
          <h3 className="story-theme-title">{themeTitle}</h3>
          <button
            type="button"
            className={`story-bookmark-btn ${isSaved ? 'active' : ''}`}
            onClick={handleToggleSave}
            title={isSaved ? '북마크 취소' : '북마크 저장'}
            aria-label={isSaved ? `${poi.name} 북마크 취소` : `${poi.name} 북마크 저장`}
          >
            <Bookmark
              size={18}
              fill={isSaved ? 'currentColor' : 'none'}
              className="bookmark-icon"
            />
            <span className="bookmark-label">{isSaved ? '북마크됨' : '북마크'}</span>
          </button>
        </div>

        {isStreaming && (
          <div className="bubble-header streaming-only-header">
            <div className="bubble-header-left">
              <span className="streaming-pulse">
                <span className="pulse-dot" />
                이야기를 생각중...
              </span>
            </div>
          </div>
        )}

        {/* Multi-paragraph Story Content */}
        <div className="bubble-content deep-story-content">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, idx) => (
              <p key={idx} className="story-paragraph">
                {para}
                {isStreaming && idx === paragraphs.length - 1 && <span className="typewriter-cursor">|</span>}
              </p>
            ))
          ) : (
            <p className="story-paragraph">
              {storyText}
              {isStreaming && <span className="typewriter-cursor">|</span>}
            </p>
          )}
        </div>

        {/* Direct Source Citation Line (Extra Small & Subtle) */}
        <div className="bubble-footer" style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f2f2f2' }}>
          <div className="rag-direct-citation" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3px', fontSize: '0.625rem', color: '#888', lineHeight: 1.35 }}>
            <BookOpen size={11} className="book-icon" style={{ color: '#999', flexShrink: 0 }} />
            <span style={{ fontWeight: 500, color: '#777' }}>공인 출처:</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rag-archive-link"
              style={{
                color: '#777',
                fontSize: '0.625rem',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(0, 0, 0, 0.2)',
                textUnderlineOffset: '2px',
                fontWeight: 400
              }}
              title="공식 원문 열기"
            >
              {academicSources}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
