import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, MessageSquareHeart, RefreshCw, Camera } from 'lucide-react';
import { UserCommunityStory } from '../data/communityStories';
import { POI } from '../types/docent';
import { getRandomJejuNickname } from '../services/jejuDialectService';

interface CommunityArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  poi: POI;
  onSubmitStory: (story: UserCommunityStory) => void;
}

export const CommunityArchiveModal: React.FC<CommunityArchiveModalProps> = ({
  isOpen,
  onClose,
  poi,
  onSubmitStory
}) => {
  const [generatedNickname, setGeneratedNickname] = useState('');
  const [content, setContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Automatically generate a new Jeju Dialect random nickname when modal opens or POI changes
  useEffect(() => {
    if (isOpen) {
      setGeneratedNickname(getRandomJejuNickname(poi.id));
      setAttachedImage(null);
    }
  }, [isOpen, poi.id]);

  if (!isOpen) return null;

  const handleRefreshNickname = () => {
    setGeneratedNickname(getRandomJejuNickname());
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if image file
    if (!file.type.startsWith('image/')) {
      alert('동영상은 첨부할 수 없습니다. 사진 이미지 파일만 선택 가능합니다!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('이야기나 추억 내용을 입력해주세요!');
      return;
    }

    const newStory: UserCommunityStory = {
      id: `user-story-${Date.now()}`,
      poiId: poi.id,
      authorName: generatedNickname || '다정한 바당',
      authorType: '우리 동네 주민',
      category: '옛날 이야기/전설',
      content: content.trim(),
      imageUrl: attachedImage || undefined,
      createdAt: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      likes: 0
    };

    onSubmitStory(newStory);
    setContent('');
    setAttachedImage(null);
    onClose();
  };

  const modalNode = (
    <div className="modal-backdrop archive-modal-backdrop" onClick={onClose}>
      <div className="modal-sheet archive-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
              <MessageSquareHeart size={18} style={{ color: '#E65100' }} />
              이야기 남기기
            </h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="archive-form-body">
          {/* Read-Only Jeju Dialect Nickname Display */}
          <div className="form-group">
            <label>작성자</label>
            <div className="read-only-nickname-badge">
              <span className="assigned-nickname-text">{generatedNickname}</span>
              <button
                type="button"
                className="refresh-nickname-btn"
                onClick={handleRefreshNickname}
                title="새로운 닉네임 생성"
              >
                <RefreshCw size={12} />
                <span>다시 뽑기</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="storyContent">이야기 입력 *</label>
            <textarea
              id="storyContent"
              rows={3}
              placeholder={`[${poi.name}]에 대한 이야기나 추억을 자유롭게 남겨주세요.`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Photo Attachment Section (Images ONLY, no videos) */}
          <div className="form-group">
            <label>사진 첨부</label>
            <div className="photo-attachment-wrapper">
              <input
                id="photoFileInput"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ display: 'none' }}
              />

              {!attachedImage ? (
                <label htmlFor="photoFileInput" className="photo-attach-label-btn">
                  <Camera size={15} />
                  <span>사진 선택</span>
                </label>
              ) : (
                <div className="attached-photo-preview">
                  <img src={attachedImage} alt="첨부 이미지 예시" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemoveImage}
                    title="사진 삭제"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="archive-form-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-story-btn">
              <Send size={14} />
              등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalNode, document.body);
};
