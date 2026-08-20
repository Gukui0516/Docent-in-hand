import React, { useState } from 'react';
import { Key, X, CheckCircle, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(geminiService.getApiKey());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      geminiService.setApiKey(apiKeyInput.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        if (onKeySaved) onKeySaved();
        onClose();
      }, 700);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card api-key-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Key size={18} className="modal-header-icon" />
            <h2 className="modal-title">Gemini API 키 설정</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="api-key-form">
          <p className="api-key-desc">
            한국학중앙연구원 학술 데이터베이스 기반 <strong>100% 실시간 RAG 생성</strong>을 위해 Google Gemini API Key가 사용됩니다. 입력하신 키는 브라우저 로컬 스토리지에 안전하게 보관됩니다.
          </p>

          <div className="input-group">
            <label htmlFor="gemini-key-input" className="input-label">
              Gemini API Key
            </label>
            <input
              id="gemini-key-input"
              type="password"
              className="key-text-input"
              placeholder="AIzaSy..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer-row">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="api-key-link"
            >
              <span>API 키 발급받기 (Google AI Studio)</span>
              <ExternalLink size={13} />
            </a>

            <button type="submit" className="btn-save-key">
              {isSaved ? (
                <>
                  <CheckCircle size={16} />
                  <span>저장 완료!</span>
                </>
              ) : (
                '저장 및 실시간 생성'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
