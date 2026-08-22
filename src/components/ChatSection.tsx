import React, { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage, POI } from '../types/docent';
import { Send, MessageCircle, Cpu } from 'lucide-react';

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

  return (
    <section className="chat-section-container" aria-label="실시간 QnA 대화창">
      <div className="chat-section-header">
        <div className="chat-header-title">
          <MessageCircle size={16} className="chat-icon" />
          <h3>궁금한 게 있으신가요?</h3>
        </div>
      </div>

      {/* Messages Feed */}
      {(messages.length > 0 || isReplying) && (
        <div className="messages-feed">
          {messages.map((msg) => (
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
          ))}

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
      )}

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder={`${poi.name}에 대해 궁금한 점을 적어주세요...`}
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
