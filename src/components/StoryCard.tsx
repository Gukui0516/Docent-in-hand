import React from 'react';
import { Character } from '../types/docent';
import { Sparkles } from 'lucide-react';

interface StoryCardProps {
  character: Character;
  storyText: string;
  isStreaming: boolean;
  onPlayDialectSample?: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  character,
  storyText,
  isStreaming
}) => {
  return (
    <section className="story-card-container" aria-label="1인칭 스낵 스토리">
      {/* Persona Header */}
      <div className="persona-banner">
        <div className="persona-avatar-wrapper" style={{ backgroundColor: `${character.badgeColor}15` }}>
          <span className="persona-emoji">{character.avatarEmoji}</span>
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
      </div>

      {/* Speech Bubble Card */}
      <div className="speech-bubble-card">
        <div className="bubble-header">
          <span className="bubble-tag">
            <Sparkles size={13} className="sparkle-icon" />
            1인칭 설화 스낵 도슨트 (30초 완독)
          </span>
          {isStreaming && (
            <span className="streaming-pulse">
              <span className="pulse-dot" />
              이야기 들려주는 중...
            </span>
          )}
        </div>

        <div className="bubble-content">
          <p className="story-text">
            {storyText}
            {isStreaming && <span className="typewriter-cursor">|</span>}
          </p>
        </div>

        <div className="bubble-footer">
          <span className="fact-badge">
            🏛️ 한국학중앙연구원 학술 팩트 100% 반영
          </span>
        </div>
      </div>
    </section>
  );
};
