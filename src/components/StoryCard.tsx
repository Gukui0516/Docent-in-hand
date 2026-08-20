import React, { useState } from 'react';
import { Character, POI } from '../types/docent';
import { Sparkles, BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { RAG_KNOWLEDGE_BASE } from '../data/ragKnowledgeBase';
import { getThemeTitle } from '../utils/themeTitle';

interface StoryCardProps {
  character: Character;
  poi: POI;
  storyText: string;
  isStreaming: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  poi,
  storyText,
  isStreaming,
}) => {
  const [showReferences, setShowReferences] = useState(false);

  const ragDoc = RAG_KNOWLEDGE_BASE[poi.id];

  // Split story into readable narrative paragraphs
  const paragraphs = storyText.split(/\n\n+/).filter((p) => p.trim().length > 0);

  return (
    <section className="story-card-container" aria-label="1인칭 맞춤형 심층 도슨트">
      {/* Speech Bubble Card */}
      <div className="speech-bubble-card deep-story-card">
        <div className="bubble-header">
          <div className="bubble-header-left">
            <span className="bubble-tag deep-tag">
              <Sparkles size={13} className="sparkle-icon" />
              {getThemeTitle(poi, ragDoc)}
            </span>
            {isStreaming && (
              <span className="streaming-pulse">
                <span className="pulse-dot" />
                들려주는 중...
              </span>
            )}
          </div>
        </div>

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

        {/* Footer & Grounded RAG Citation Accordion */}
        <div className="bubble-footer">
          <div className="rag-citation-header" onClick={() => setShowReferences(!showReferences)}>
            <div className="rag-verified-label">
              <BookOpen size={13} className="book-icon" />
              <span>한국학중앙연구원 향토문화전자대전 18종 아카이브 검증 완료</span>
            </div>
            <button type="button" className="btn-toggle-ref" aria-label="출처 보기">
              {showReferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showReferences && ragDoc && (
            <div className="rag-reference-panel">
              <div className="rag-ref-item">
                <span className="rag-ref-label">📜 설화 원문 기록:</span>
                <span className="rag-ref-val">「{ragDoc.folkloreNarrative.title}」 ({ragDoc.folkloreNarrative.story})</span>
              </div>
              <div className="rag-ref-item">
                <span className="rag-ref-label">👑 역사적 배경 & 유산:</span>
                <span className="rag-ref-val">{ragDoc.historyAndCulture.culturalHeritageRank} - {ragDoc.historyAndCulture.historicalContext}</span>
              </div>
              <div className="rag-ref-item">
                <span className="rag-ref-label">🌋 자연지질 형성사:</span>
                <span className="rag-ref-val">{ragDoc.geologyAndNature.formationProcess}</span>
              </div>
              <div className="rag-ref-item">
                <span className="rag-ref-label">📚 공인 출처:</span>
                <span className="rag-ref-val">
                  {ragDoc.academicReferences?.join(', ') || '한국학중앙연구원 향토문화전자대전'}
                  {(ragDoc.sourceUrl || poi.sourceUrl || poi.id) && (
                    <a
                      href={ragDoc.sourceUrl || poi.sourceUrl || `https://jeju.grandculture.net/jeju/toc/${poi.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rag-archive-link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        marginLeft: '8px',
                        color: '#eb5e28',
                        textDecoration: 'underline',
                        fontWeight: 600
                      }}
                      title="한국학중앙연구원 공식 원문 열기"
                    >
                      [공식 아카이브 원문 바로가기 <ExternalLink size={11} />]
                    </a>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
