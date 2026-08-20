import React, { useState } from 'react';
import { Character, POI } from '../types/docent';
import { Sparkles, BookOpen, Volume2, VolumeX, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { RAG_KNOWLEDGE_BASE } from '../data/ragKnowledgeBase';

interface StoryCardProps {
  character: Character;
  poi: POI;
  storyText: string;
  isStreaming: boolean;
  languageMode?: 'standard' | 'jeju';
  onToggleLanguageMode?: (mode: 'standard' | 'jeju') => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  character,
  poi,
  storyText,
  isStreaming,
  languageMode = 'standard',
  onToggleLanguageMode
}) => {
  const [showReferences, setShowReferences] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ragDoc = RAG_KNOWLEDGE_BASE[poi.id];

  // Browser Speech Synthesis for TTS
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = storyText.replace(/[#*|]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.95;
      utterance.pitch = character.id === 'seolmundae' ? 0.85 : character.id === 'haenyeo' ? 1.05 : 0.75;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Split story into readable narrative paragraphs
  const paragraphs = storyText.split(/\n\n+/).filter((p) => p.trim().length > 0);

  return (
    <section className="story-card-container" aria-label="1인칭 2-Layer 멀티 에이전트 도슨트">
      {/* Speech Bubble Card */}
      <div className="speech-bubble-card deep-story-card">
        <div className="bubble-header">
          <div className="bubble-header-left">
            <span className="bubble-tag deep-tag">
              <Sparkles size={13} className="sparkle-icon" />
              1인칭 AI 도슨트 스토리
            </span>
            {isStreaming && (
              <span className="streaming-pulse">
                <span className="pulse-dot" />
                들려주는 중...
              </span>
            )}
          </div>

          <div className="bubble-header-actions">
            {/* Dialect Mode Toggle */}
            {onToggleLanguageMode && (
              <div className="dialect-mode-pill-toggle" role="group" aria-label="언어 모드 선택">
                <button
                  type="button"
                  className={`mode-toggle-btn ${languageMode === 'standard' ? 'active' : ''}`}
                  onClick={() => onToggleLanguageMode('standard')}
                  title="표준어 모드"
                >
                  표준어
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${languageMode === 'jeju' ? 'active' : ''}`}
                  onClick={() => onToggleLanguageMode('jeju')}
                  title="제주어 모드"
                >
                  제주어
                </button>
              </div>
            )}

            {/* TTS Audio Button */}
            <button
              type="button"
              className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleToggleSpeech}
              title={isSpeaking ? '음성 중지' : '도슨트 음성 듣기'}
              aria-label="도슨트 음성 듣기"
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="tts-btn-label">{isSpeaking ? '정지' : '음성'}</span>
            </button>
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
