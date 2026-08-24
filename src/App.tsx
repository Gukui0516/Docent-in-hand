import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Home, ChevronLeft, ChevronRight, Bookmark, BookOpen } from 'lucide-react';
import { POI, POISummary, Character, ChatMessage } from './types/docent';
import { loadPOIIndex, resolvePOI, placeholderPOI } from './services/poiDataService';
import { CHARACTERS } from './data/characters';
import { findNearestPOI, formatDistance, calculateDistanceMeters, hasClearAddress } from './utils/geo';
import { AgentClientService, AgentStatusEvent } from './services/agentClientService';
import { PhotoCard } from './components/PhotoCard';
import { StoryCard } from './components/StoryCard';
import { UserArchiveSection } from './components/UserArchiveSection';
import { ChatSection } from './components/ChatSection';
import { POICarousel } from './components/POICarousel';
import { SavedStoriesModal } from './components/SavedStoriesModal';
import { VisitHistoryService } from './services/visitHistoryService';
import { BenchmarkModal } from './components/BenchmarkModal';
import { GPSSimulatorModal } from './components/GPSSimulatorModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HallucinationLabPage } from './pages/HallucinationLabPage';
import './App.css';

export const App: React.FC = () => {
  // Simple URL-based routing (/lab or /eval)
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const isLabRoute =
    currentPath.startsWith('/lab') ||
    currentPath.startsWith('/eval') ||
    window.location.hash.includes('lab') ||
    window.location.hash.includes('eval');

  // State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 33.4586,
    lng: 126.9423 // Default: 성산일출봉
  });
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [poiIndex, setPoiIndex] = useState<POISummary[]>([]);
  const [indexError, setIndexError] = useState('');
  const [currentPOI, setCurrentPOI] = useState<POI | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Character>(
    CHARACTERS.summaryAgent || Object.values(CHARACTERS)[0]
  );
  const [distanceText, setDistanceText] = useState('80m 앞');

  // Story & Streaming
  const [storyText, setStoryText] = useState('');
  const [isStoryStreaming, setIsStoryStreaming] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [agentChatStatus, setAgentChatStatus] = useState('');

  // Modals
  const [isPOIListOpen, setIsPOIListOpen] = useState(false);
  const [isSavedStoriesOpen, setIsSavedStoriesOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isGPSModalOpen, setIsGPSModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const isInitialStoryStarted = useRef(false);
  const poiIndexRef = useRef<POISummary[]>([]);
  const mainContentRef = useRef<HTMLElement>(null);
  const storyAbortController = useRef<AbortController | null>(null);

  // Zero-Click Story Generator via 2-Layer Multi-Agent Backend
  const triggerZeroClickStory = useCallback(async (
    poi: POI,
    character: Character
  ) => {
    if (storyAbortController.current) {
      storyAbortController.current.abort();
    }
    const abortController = new AbortController();
    storyAbortController.current = abortController;

    setIsStoryStreaming(true);
    setStoryText('');
    setMessages([]);

    try {
      await AgentClientService.streamDocentStory(
        poi,
        character,
        (_status: AgentStatusEvent) => {
          if (abortController.signal.aborted) return;
        },
        (token: string) => {
          if (abortController.signal.aborted) return;
          setStoryText((prev) => prev + token);
        },
        (fullText: string) => {
          if (abortController.signal.aborted) return;
          setStoryText(fullText);
          setIsStoryStreaming(false);
        },
        (errorMsg: string) => {
          if (abortController.signal.aborted) return;
          console.error('Story streaming error:', errorMsg);
          setStoryText((prev) => (prev ? prev : `⚠️ 해설을 불러오지 못했습니다: ${errorMsg}`));
          setIsStoryStreaming(false);
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Previous docent story stream aborted.');
      } else {
        console.error('Docent story stream failed:', err);
      }
    }
  }, []);

  // Update POI and automatically set character & trigger story
  //
  // 스토리 스트리밍은 이름·좌표만 있으면 시작할 수 있으므로, 상세 조각(poi/{id}.json)이
  // 도착하기를 기다리지 않고 자리표시자로 즉시 화면을 띄운 뒤 병렬로 채운다.
  const applyPOI = useCallback((summary: POISummary, distMeters?: number) => {
    const assignedChar =
      CHARACTERS[summary.assignedCharacterId] || CHARACTERS.summaryAgent || Object.values(CHARACTERS)[0];

    const placeholder = placeholderPOI(summary);
    setCurrentPOI(placeholder);
    setCurrentCharacter(assignedChar);
    setDistanceText(distMeters !== undefined ? `직선거리 ${formatDistance(distMeters)}` : (hasClearAddress(summary.region) ? summary.region : summary.category));

    // Record visit in history
    VisitHistoryService.recordVisit(summary, placeholder.imageUrl, placeholder.mythAndFact?.summary);

    triggerZeroClickStory(placeholder, assignedChar);

    resolvePOI(summary)
      .then((full) => {
        // 상세를 기다리는 동안 사용자가 다른 POI 로 옮겼다면 덮어쓰지 않는다.
        setCurrentPOI((prev) => {
          if (prev && prev.id === full.id) {
            VisitHistoryService.recordVisit(full, full.imageUrl, full.mythAndFact?.summary);
            return full;
          }
          return prev;
        });
      })
      .catch((err) => console.warn(`POI 상세 로드 실패 (${summary.id}):`, err));
  }, [triggerZeroClickStory]);

  // Sorted POIs related to current location / region
  const relevantPOIs = useMemo(() => {
    if (!currentPOI) return [];
    const currentRegionClean = currentPOI.region.replace(/\s+/g, '');

    const sameRegionList = poiIndex.filter((poi) => {
      const reg = poi.region.replace(/\s+/g, '');
      return reg.includes(currentRegionClean) || currentRegionClean.includes(reg);
    });

    const candidateList = sameRegionList.length >= 2 ? sameRegionList : poiIndex;

    return candidateList
      .map((poi) => {
        const distMeters = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          poi.latitude,
          poi.longitude
        );
        return { poi, distMeters };
      })
      .sort((a, b) => a.distMeters - b.distMeters);
  }, [currentPOI, poiIndex, userLocation]);

  const handleSelectNextRelevantPOI = useCallback(() => {
    if (!currentPOI || relevantPOIs.length === 0) return;
    const currentIndex = relevantPOIs.findIndex((item) => item.poi.id === currentPOI.id);
    const nextIndex = (currentIndex + 1) % relevantPOIs.length;
    const nextItem = relevantPOIs[nextIndex];
    applyPOI(nextItem.poi, nextItem.distMeters);
  }, [relevantPOIs, currentPOI, applyPOI]);

  const handleSelectPrevRelevantPOI = useCallback(() => {
    if (!currentPOI || relevantPOIs.length === 0) return;
    const currentIndex = relevantPOIs.findIndex((item) => item.poi.id === currentPOI.id);
    const prevIndex = (currentIndex - 1 + relevantPOIs.length) % relevantPOIs.length;
    const prevItem = relevantPOIs[prevIndex];
    applyPOI(prevItem.poi, prevItem.distMeters);
  }, [relevantPOIs, currentPOI, applyPOI]);

  // Request Real Device GPS
  const handleUseRealGPS = useCallback(() => {
    if ('geolocation' in navigator) {
      setIsSyncingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          console.log(`[GPS 수신 성공] 위도: ${lat}, 경도: ${lng}, 정확도: ±${accuracy}m`);

          setUserLocation({ lat, lng });
          setIsGpsActive(true);
          const result = findNearestPOI(lat, lng, poiIndexRef.current);
          if (result) applyPOI(result.poi, result.distanceMeters);
          setIsSyncingLocation(false);
        },
        (err) => {
          console.warn('[GPS 수신 실패 또는 거부]:', err);
          setIsSyncingLocation(false);
          alert('브라우저 위치 권한이 차단되었거나 수신할 수 없습니다. 주소창 좌측의 [위치 권한]을 허용으로 변경하시거나 상단 [GPS 설정]에서 위치를 직접 지정해보세요!');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('이 브라우저는 Geolocation API를 지원하지 않습니다.');
    }
  }, [applyPOI]);

  const handleSelectSavedPOI = useCallback((poiId: string) => {
    const found = poiIndexRef.current.find((p) => p.id === poiId);
    if (found) {
      const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, found.latitude, found.longitude);
      applyPOI(found, dist);
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [userLocation, applyPOI]);

  // Apply Simulated GPS Coordinates
  const handleApplyCoordinates = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setIsGpsActive(true);
    const result = findNearestPOI(lat, lng, poiIndexRef.current);
    if (result) applyPOI(result.poi, result.distanceMeters);
  }, [applyPOI]);

  // Initial Flow (Zero-Click): POI 인덱스(gzip 62KB)를 먼저 받고 나서 GPS 로 최근접 명소를 고른다.
  useEffect(() => {
    if (isInitialStoryStarted.current) return;
    isInitialStoryStarted.current = true;

    loadPOIIndex()
      .then((index) => {
        setPoiIndex(index);
        poiIndexRef.current = index;
        if (index.length === 0) {
          setIndexError('POI 데이터가 비어 있습니다.');
          return;
        }

        const fallback = () => applyPOI(index[0], 80);

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setUserLocation({ lat, lng });
              setIsGpsActive(true);
              const result = findNearestPOI(lat, lng, index);
              if (result) applyPOI(result.poi, result.distanceMeters);
              else fallback();
            },
            fallback,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          fallback();
        }
      })
      .catch((err) => {
        console.error('POI 인덱스 로드 실패:', err);
        setIndexError('명소 목록을 불러오지 못했습니다. 새로고침해 주세요.');
      });
  }, [applyPOI]);

  // Handle user chat message via 2-Layer Multi-Agent Backend
  const handleSendMessage = async (text: string) => {
    if (!currentPOI) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsReplying(true);
    setAgentChatStatus(`🔍 [리서치 에이전트] 팩트 인출 중...`);

    const modelMsgId = `model-${Date.now()}`;
    let accumulatedModelText = '';

    const historyForAgent = [...messages, userMsg].map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      text: m.text
    }));

    await AgentClientService.streamChat(
      currentPOI,
      currentCharacter,
      text,
      historyForAgent,
      (status: AgentStatusEvent) => {
        setAgentChatStatus(status.message);
      },
      (chunk: string) => {
        accumulatedModelText += chunk;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== modelMsgId);
          return [
            ...filtered,
            {
              id: modelMsgId,
              sender: 'model',
              text: accumulatedModelText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              characterId: currentCharacter.id
            }
          ];
        });
      },
      (fullText: string) => {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== modelMsgId);
          return [
            ...filtered,
            {
              id: modelMsgId,
              sender: 'model',
              text: fullText || accumulatedModelText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              characterId: currentCharacter.id
            }
          ];
        });
        setIsReplying(false);
        setAgentChatStatus('');
      },
      (errMsg: string) => {
        console.error('Chat stream error:', errMsg);
        setIsReplying(false);
        setAgentChatStatus('');
      }
    );
  };

  // Dedicated URL Route: /lab or /eval (Grounding Hallucination Evaluation Page)
  if (isLabRoute) {
    return <HallucinationLabPage />;
  }

  // 인덱스 도착 전 로딩 화면. gzip 62KB 라 보통 순식간에 지나간다.
  if (!currentPOI) {
    return (
      <div className="app-shell app-booting">
        <div className="boot-status" role="status" aria-live="polite">
          {indexError ? <p className="boot-error">⚠️ {indexError}</p> : <p>제주 명소 데이터를 불러오는 중…</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="main-content" ref={mainContentRef}>
        <div className="content-container">
          {/* Left Column (Desktop Showcase & Quick Nearby Switcher) */}
          <aside className="desktop-left-column">
            <div className="immersive-place-hero">
              {/* Official High-Resolution Photo Card */}
              <PhotoCard
                poi={currentPOI}
                distanceText={distanceText}
                onSyncLocation={handleUseRealGPS}
                onOpenLocationSettings={() => setIsGPSModalOpen(true)}
                isSyncing={isSyncingLocation}
              />
            </div>

          </aside>

          {/* Right Column (Docent Persona Story & Real-time Tiki-taka Chat) */}
          <section className="desktop-right-column">
            {/* Zero-Click 1st Person Multi-Agent Deep Story */}
            <StoryCard
              poi={currentPOI}
              storyText={storyText}
              isStreaming={isStoryStreaming}
            />

            {/* Community Memory & Story Archive (주민 & 탐방객의 옛날 기억 아카이브) */}
            <UserArchiveSection poi={currentPOI} />

            {/* Real-time Interactive Q&A (Tiki-taka) */}
            <ChatSection
              character={currentCharacter}
              poi={currentPOI}
              messages={messages}
              isReplying={isReplying}
              agentChatStatus={agentChatStatus}
              onSendMessage={handleSendMessage}
            />

            {/* Direct Academic Source Citation Line (Below Chatbot) */}
            <div className="docent-academic-citation-footer">
              <BookOpen size={11} className="book-icon" />
              <span className="citation-prefix">공인 출처:</span>
              <a
                href={currentPOI.ragDocument?.sourceUrl || currentPOI.sourceUrl || `https://jeju.grandculture.net/jeju/toc/${currentPOI.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rag-archive-link"
                title="한국학중앙연구원 공식 원문 열기"
              >
                {currentPOI.ragDocument?.academicReferences
                  ?.map((source) => source.replace(/\s*\(항목\s*ID\s*:\s*[^)]+\)/gi, ''))
                  .join(', ') || '한국향토문화전자대전 (한국학중앙연구원)'}
              </a>
            </div>
          </section>

        </div>
      </main>

      <nav className={`mobile-bottom-nav ${isPOIListOpen ? 'explore-open' : ''}`} aria-label="주요 네비게이션 메뉴">
        <button
          type="button"
          className="mobile-bottom-nav-item nav-poi-switcher-btn"
          onClick={handleSelectPrevRelevantPOI}
          disabled={relevantPOIs.length <= 1}
          aria-label="이전 주변 명소"
          title="이전 주변 명소로 이동"
        >
          <ChevronLeft size={19} strokeWidth={2.2} />
          <span>이전 명소</span>
        </button>
        <button
          type="button"
          className={`mobile-bottom-nav-item ${isSavedStoriesOpen ? 'active' : ''}`}
          onClick={() => {
            setIsPOIListOpen(false);
            setIsSavedStoriesOpen(true);
          }}
          aria-label="북마크한 명소 이야기"
          title="북마크 열기"
        >
          <Bookmark size={19} strokeWidth={2.2} />
          <span>북마크</span>
          <i aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`mobile-bottom-nav-item ${!isPOIListOpen && !isSavedStoriesOpen ? 'active' : ''}`}
          onClick={() => {
            setIsPOIListOpen(false);
            setIsSavedStoriesOpen(false);
            mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-current={!isPOIListOpen && !isSavedStoriesOpen ? 'page' : undefined}
        >
          <Home size={19} strokeWidth={2.2} />
          <span>지금 여기</span>
          <i aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`mobile-bottom-nav-item ${isPOIListOpen ? 'active' : ''}`}
          onClick={() => {
            setIsSavedStoriesOpen(false);
            setIsPOIListOpen(true);
          }}
          aria-current={isPOIListOpen ? 'page' : undefined}
        >
          <Search size={19} strokeWidth={2.2} />
          <span>명소 탐색</span>
          <i aria-hidden="true" />
        </button>
        <button
          type="button"
          className="mobile-bottom-nav-item nav-poi-switcher-btn"
          onClick={handleSelectNextRelevantPOI}
          disabled={relevantPOIs.length <= 1}
          aria-label="다음 주변 명소"
          title="다음 주변 명소로 이동"
        >
          <ChevronRight size={19} strokeWidth={2.2} />
          <span>다음 명소</span>
        </button>
      </nav>

      {/* Combined Bookmarks & Visit History Modal */}
      <SavedStoriesModal
        isOpen={isSavedStoriesOpen}
        onClose={() => setIsSavedStoriesOpen(false)}
        onSelectSavedPOI={handleSelectSavedPOI}
        currentPOIId={currentPOI.id}
      />

      {/* Manual POI Explore Modal */}
      <POICarousel
        isOpen={isPOIListOpen}
        onClose={() => setIsPOIListOpen(false)}
        selectedPOIId={currentPOI.id}
        pois={poiIndex}
        onSelectPOI={(poi, dist) => applyPOI(poi, dist)}
        userLocation={userLocation}
      />

      {/* Real-time A/B Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        userLat={userLocation.lat}
        userLng={userLocation.lng}
        pois={poiIndex}
      />

      {/* GPS Location Simulator Modal */}
      <GPSSimulatorModal
        isOpen={isGPSModalOpen}
        onClose={() => setIsGPSModalOpen(false)}
        currentLat={userLocation.lat}
        currentLng={userLocation.lng}
        onApplyCoordinates={handleApplyCoordinates}
        onUseRealGPS={handleUseRealGPS}
        isRealGpsActive={isGpsActive}
      />

      {/* Gemini API Key Settings Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={() => triggerZeroClickStory(currentPOI, currentCharacter)}
      />
    </div>
  );
};

export default App;
