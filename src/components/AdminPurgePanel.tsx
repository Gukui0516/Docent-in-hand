import React, { useState } from 'react';
import { Trash2, ShieldAlert, Loader2 } from 'lucide-react';

/**
 * 방명록 전체 삭제 패널 (/lab 관리자 도구).
 *
 * /lab 은 인증 없이 인터넷에 열려 있는 페이지다. 버튼만 두면 누구나 방명록을
 * 통째로 날릴 수 있으므로 서버가 x-admin-token 헤더를 검사한다. 이 컴포넌트는
 * 토큰을 입력받아 전달할 뿐이고, 실제 판정은 전적으로 서버가 한다
 * (클라이언트 검증은 우회 가능하므로 방어선으로 치지 않는다).
 *
 * 토큰은 sessionStorage 에만 둔다 — 탭을 닫으면 사라지고, 공용 PC 에서
 * 시연하더라도 localStorage 처럼 영구히 남지 않는다.
 */

const TOKEN_KEY = 'docent_admin_token';
const CONFIRM_PHRASE = '전체삭제';

export const AdminPurgePanel: React.FC = () => {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [confirmText, setConfirmText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const canSubmit = token.trim().length > 0 && confirmText === CONFIRM_PHRASE && !isWorking;

  const handlePurge = async () => {
    if (!canSubmit) return;

    setIsWorking(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/stories', {
        method: 'DELETE',
        headers: { 'x-admin-token': token.trim() }
      });

      if (res.ok) {
        const data = await res.json();
        try {
          sessionStorage.setItem(TOKEN_KEY, token.trim());
        } catch {
          // 저장 실패는 무시 — 기능에는 영향 없다.
        }
        setMessage({
          kind: 'ok',
          text: `방명록 ${data.deleted}건을 삭제했습니다. (서버 재기동 시 샘플 5건은 다시 생성됩니다)`
        });
        setConfirmText('');
      } else if (res.status === 401) {
        setMessage({ kind: 'err', text: '관리자 토큰이 올바르지 않습니다.' });
      } else if (res.status === 429) {
        setMessage({ kind: 'err', text: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ kind: 'err', text: data.error || `삭제 실패 (HTTP ${res.status})` });
      }
    } catch (e: any) {
      setMessage({ kind: 'err', text: `요청 실패: ${e?.message ?? '네트워크 오류'}` });
    } finally {
      setIsWorking(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="admin-purge-toggle"
        onClick={() => setIsOpen(true)}
        title="방명록 전체 삭제 (관리자 토큰 필요)"
      >
        <ShieldAlert size={14} />
        <span>관리자</span>
      </button>
    );
  }

  return (
    <div className="admin-purge-panel" role="region" aria-label="관리자 도구">
      <div className="admin-purge-head">
        <ShieldAlert size={15} />
        <strong>방명록 전체 삭제</strong>
        <button type="button" className="admin-purge-close" onClick={() => setIsOpen(false)} aria-label="닫기">
          ×
        </button>
      </div>

      <p className="admin-purge-warn">
        모든 사용자가 남긴 글과 공감이 <b>영구 삭제</b>됩니다. 되돌릴 수 없습니다.
      </p>

      <label className="admin-purge-field">
        <span>관리자 토큰</span>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Secret Manager: admin-token"
          autoComplete="off"
        />
      </label>

      <label className="admin-purge-field">
        <span>
          확인을 위해 <code>{CONFIRM_PHRASE}</code> 를 입력하세요
        </span>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          autoComplete="off"
        />
      </label>

      <button type="button" className="admin-purge-run" onClick={handlePurge} disabled={!canSubmit}>
        {isWorking ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
        <span>{isWorking ? '삭제 중…' : '전체 삭제 실행'}</span>
      </button>

      {message && (
        <p className={`admin-purge-msg ${message.kind}`} role="status">
          {message.text}
        </p>
      )}
    </div>
  );
};
