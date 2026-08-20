import React, { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage, POI } from '../types/docent';
import { Send, MessageCircle, HelpCircle, Cpu } from 'lucide-react';

interface ChatSectionProps {
  character: Character;
  poi: POI;
  messages: ChatMessage[];
  isReplying: boolean;
  agentChatStatus?: string;
  onSendMessage: (text: string) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  character,
  poi,
  messages,
  isReplying,
  agentChatStatus,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isReplying]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isReplying) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleChipClick = (question: string) => {
    if (isReplying) return;
    onSendMessage(question);
  };

  return (
    <section className="chat-section-container" aria-label="실시간 QnA 대화창">
      <div className="chat-section-header">
        <div className="chat-header-title">
          <MessageCircle size={16} className="chat-icon" />
          <h3>{character.name}와 실시간 QnA</h3>
        </div>
        <span className="live-status">실시간 AI 도슨트 연결됨</span>
      </div>

      {/* Suggested Question Chips */}
      <div className="quick-chips-wrapper">
        <div className="chips-label">
          <HelpCircle size={13} />
          <span>추천 질문</span>
        </div>
        <div className="chips-list">
          {poi.sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleChipClick(q)}
              disabled={isReplying}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="messages-feed">
        {messages.length === 0 ? (
          <div className="empty-chat-hint">
            <p>💡 위의 추천 질문을 누르거나 직접 궁금한 점을 물어보세요!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'model-row'}`}
            >
              {msg.sender === 'model' && (
                <div className="model-avatar-mini" style={{ backgroundColor: `${character.badgeColor}20` }}>
                  {character.avatarUrl ? (
                    <img src={character.avatarUrl} alt={character.name} className="avatar-mini-img" />
                  ) : (
                    <span>{character.avatarEmoji}</span>
                  )}
                </div>
              )}
              <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'model-bubble'}`}>
                {msg.sender === 'model' && (
                  <span className="bubble-speaker-name">{character.name}</span>
                )}
                <p className="bubble-text">{msg.text}</p>
                <span className="bubble-time">{msg.timestamp}</span>
              </div>
            </div>
          ))
        )}

        {isReplying && (
          <div className="chat-bubble-row model-row">
            <div className="model-avatar-mini" style={{ backgroundColor: `${character.badgeColor}20` }}>
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt={character.name} className="avatar-mini-img" />
              ) : (
                <span>{character.avatarEmoji}</span>
              )}
            </div>
            <div className="chat-bubble model-bubble replying-bubble" style={{ minWidth: '220px' }}>
              <span className="bubble-speaker-name">{character.name}</span>
              {agentChatStatus ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                  <Cpu size={14} className="spin" color="#eb5e28" />
                  <span>{agentChatStatus}</span>
                </div>
              ) : (
                <div className="typing-dots">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder={`${character.name}에게 궁금한 점 물어보기...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isReplying}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputText.trim() || isReplying}
          aria-label="질문 전송"
        >
          <Send size={16} />
        </button>
      </form>
    </section>
  );
};
