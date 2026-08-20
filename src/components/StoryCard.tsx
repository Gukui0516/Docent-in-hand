import React, { useState } from 'react';
import { Character, POI } from '../types/docent';
import { Sparkles, BookOpen, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { RAG_KNOWLEDGE_BASE } from '../data/ragKnowledgeBase';

interface StoryCardProps {
  character: Character;
  poi: POI;
  storyText: string;
  isStreaming: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  character,
  poi,
  storyText,
  isStreaming
}) => {
  const [imgError, setImgError] = useState(false);
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
    <section className="story-card-container" aria-label="1인칭 RAG 심층 설화 도슨트">
      {/* Persona Header */}
      <div className="persona-banner">
        <div className="persona-avatar-wrapper" style={{ backgroundColor: `${character.badgeColor}15` }}>
          {character.avatarUrl && !imgError ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="persona-avatar-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="persona-emoji">{character.avatarEmoji}</span>
          )}
          <div className="online-indicator" />
        </div>

        <div className="persona-info">
          <div className="persona-name-row">
            <span className="persona-name">{character.name}</span>
            <span className="persona-role-badge" style={{ color: character.badgeColor, borderColor: `${character.badgeColor}40` }}>
              {character.title}
            </span>
          </div>
          <p className="persona-personality">{character.personality}</p>
        </div>

        {/* TTS Audio Button */}
        <button
          type="button"
          className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
          onClick={handleToggleSpeech}
          title={isSpeaking ? '음성 중지' : '도슨트 음성 듣기'}
          aria-label="도슨트 음성 듣기"
        >
          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span className="tts-btn-label">{isSpeaking ? '정지' : '음성 듣기'}</span>
        </button>
      </div>

      {/* Speech Bubble Card */}
      <div className="speech-bubble-card deep-story-card">
        <div className="bubble-header">
          <span className="bubble-tag deep-tag">
            <Sparkles size={13} className="sparkle-icon" />
            1인칭 RAG 심층 서사 도슨트 (3막 구성)
          </span>
          {isStreaming && (
            <span className="streaming-pulse">
              <span className="pulse-dot" />
              이야기 구술하는 중...
            </span>
          )}
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
              <span>한국학중앙연구원 향토문화전자대전 RAG 학술 근거 100% 검증</span>
            </div>
            <button type="button" className="btn-toggle-ref" aria-label="출처 보기">
              {showReferences ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {showReferences && ragDoc && (
            <div className="rag-reference-panel">
              <div className="ref-item">
                <strong>📜 설화 채록본:</strong> {ragDoc.folkloreNarrative.oralTraditionSource}
              </div>
              <div className="ref-item">
                <strong>🌋 지질학적 형성:</strong> {ragDoc.geologyAndNature.formationProcess}
              </div>
              <div className="ref-item">
                <strong>🏛️ 학술 참고문헌:</strong>
                <ul>
                  {ragDoc.academicReferences.map((ref, i) => (
                    <li key={i}>{ref}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
