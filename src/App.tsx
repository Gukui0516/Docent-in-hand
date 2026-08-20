import React, { useState, useEffect, useRef, useCallback } from 'react';
import { POI, Character, ChatMessage } from './types/docent';
import { POI_LIST } from './data/poiData';
import { CHARACTERS } from './data/characters';
import { findNearestPOI, formatDistance } from './utils/geo';
import { AgentClientService, AgentStatusEvent } from './services/agentClientService';
import { Header } from './components/Header';
import { PhotoCard } from './components/PhotoCard';
import { StoryCard } from './components/StoryCard';
import { ChatSection } from './components/ChatSection';
import { POICarousel } from './components/POICarousel';
import { BenchmarkModal } from './components/BenchmarkModal';
import { GPSSimulatorModal } from './components/GPSSimulatorModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import './App.css';

export const App: React.FC = () => {
  // State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 33.4586,
    lng: 126.9423 // Default: 성산일출봉
  });
  const [gpsLabel, setGpsLabel] = useState<string>('성산일출봉 앞');
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [currentPOI, setCurrentPOI] = useState<POI>(POI_LIST[0]);
  const [currentCharacter, setCurrentCharacter] = useState<Character>(
    CHARACTERS[POI_LIST[0].assignedCharacterId]
  );
  const [distanceText, setDistanceText] = useState('80m 앞');

  // Language Mode (Standard vs Jeju Dialect)
  const [languageMode, setLanguageMode] = useState<'standard' | 'jeju'>('standard');

  // Story & Streaming
  const [storyText, setStoryText] = useState('');
  const [isStoryStreaming, setIsStoryStreaming] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [agentChatStatus, setAgentChatStatus] = useState('');

  // Modals
  const [isPOIListOpen, setIsPOIListOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isGPSModalOpen, setIsGPSModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const isInitialStoryStarted = useRef(false);

  // Zero-Click Story Generator via 2-Layer Multi-Agent Backend
  const triggerZeroClickStory = useCallback(async (
    poi: POI,
    character: Character,
    mode: 'standard' | 'jeju' = languageMode
  ) => {
    setIsStoryStreaming(true);
    setStoryText('');
    setMessages([]);

    await AgentClientService.streamDocentStory(
      poi,
      character,
      (_status: AgentStatusEvent) => {
        // Status event handled silently in background
      },
      (token: string) => {
        setStoryText((prev) => prev + token);
      },
      (fullText: string) => {
        setStoryText(fullText);
        setIsStoryStreaming(false);
      },
      (errorMsg: string) => {
        console.error('Story streaming error:', errorMsg);
        setStoryText((prev) => (prev ? prev : `⚠️ 해설을 불러오지 못했습니다: ${errorMsg}`));
        setIsStoryStreaming(false);
      },
      mode
    );
  }, [languageMode]);

  // Toggle Language Mode (Standard vs Jeju Dialect) and regenerate story
  const handleToggleLanguageMode = useCallback((newMode: 'standard' | 'jeju') => {
    if (newMode === languageMode) return;
    setLanguageMode(newMode);
    triggerZeroClickStory(currentPOI, currentCharacter, newMode);
  }, [languageMode, currentPOI, currentCharacter, triggerZeroClickStory]);

  // Update POI and automatically set character & trigger story
  const applyPOI = useCallback((poi: POI, distMeters?: number) => {
    setCurrentPOI(poi);
    const assignedChar = CHARACTERS[poi.assignedCharacterId] || CHARACTERS.seolmundae;
    setCurrentCharacter(assignedChar);

    if (distMeters !== undefined) {
      setDistanceText(`${formatDistance(distMeters)} 앞`);
    } else {
      setDistanceText(poi.region);
    }

    triggerZeroClickStory(poi, assignedChar, languageMode);
  }, [triggerZeroClickStory, languageMode]);

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
          setGpsLabel('실시간 GPS');

          const { poi, distanceMeters } = findNearestPOI(lat, lng);
          applyPOI(poi, distanceMeters);
          setIsSyncingLocation(false);
        },
        (err) => {
          console.warn('[GPS 수신 실패 또는 거부]:', err);
          setIsSyncingLocation(false);
          alert('브라우저 위치 권한이 차단되었거나 수신할 수 없습니다. 상단 [GPS 설정]에서 가상 위치를 선택해 보세요!');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      alert('이 브라우저는 Geolocation API를 지원하지 않습니다.');
    }
  }, [applyPOI]);

  // Apply Simulated GPS Coordinates
  const handleApplyCoordinates = useCallback((lat: number, lng: number, label: string) => {
    setUserLocation({ lat, lng });
    setIsGpsActive(true);
    setGpsLabel(label);

    const { poi, distanceMeters } = findNearestPOI(lat, lng);
    applyPOI(poi, distanceMeters);
  }, [applyPOI]);

  // Initial GPS Location Flow (Zero-Click)
  useEffect(() => {
    if (isInitialStoryStarted.current) return;
    isInitialStoryStarted.current = true;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setIsGpsActive(true);
          setGpsLabel('실시간 GPS');

          const { poi, distanceMeters } = findNearestPOI(lat, lng);
          applyPOI(poi, distanceMeters);
        },
        () => {
          // Default fallback
          applyPOI(POI_LIST[0], 80);
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 }
      );
    } else {
      applyPOI(POI_LIST[0], 80);
    }
  }, [applyPOI]);

  // Handle user chat message via 2-Layer Multi-Agent Backend
  const handleSendMessage = async (text: string) => {
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
      },
      languageMode
    );
  };

  return (
    <div className="app-shell">
      <Header
        currentPlaceName={currentPOI.name}
        gpsLabel={gpsLabel}
        onOpenPOIList={() => setIsPOIListOpen(true)}
        onOpenGPSSimulator={() => setIsGPSModalOpen(true)}
        onSyncLocation={handleUseRealGPS}
        isGpsActive={isGpsActive}
        isSyncing={isSyncingLocation}
      />

      <main className="main-content">
        <div className="content-container">
          {/* Left Column (Desktop Showcase & Quick Nearby Switcher) */}
          <aside className="desktop-left-column">
            {/* Official High-Resolution Photo Card */}
            <PhotoCard poi={currentPOI} distanceText={distanceText} />

            {/* Desktop Quick POI Recommendations */}
            <div className="desktop-quick-poi-card">
              <div className="desktop-quick-poi-header">
                <span className="quick-poi-title">📍 연관 추천 명소</span>
                <button
                  type="button"
                  className="quick-poi-all-btn"
                  onClick={() => setIsPOIListOpen(true)}
                >
                  전체 3,591개 ↗
                </button>
              </div>
              <div className="desktop-quick-poi-list">
                {POI_LIST.filter((p) => p.id !== currentPOI.id && (p.region === currentPOI.region || p.category === currentPOI.category))
                  .slice(0, 4)
                  .map((poi) => (
                    <button
                      key={poi.id}
                      type="button"
                      className="desktop-quick-poi-item"
                      onClick={() => applyPOI(poi)}
                    >
                      <img
                        src={poi.imageUrl || 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=300&q=80'}
                        alt={poi.name}
                        className="quick-poi-thumb"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="quick-poi-info">
                        <span className="quick-poi-name">{poi.name}</span>
                        <span className="quick-poi-meta">{poi.category}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </aside>

          {/* Right Column (Docent Persona Story & Real-time Tiki-taka Chat) */}
          <section className="desktop-right-column">
            {/* Zero-Click 1st Person Multi-Agent Deep Story */}
            <StoryCard
              character={currentCharacter}
              poi={currentPOI}
              storyText={storyText}
              isStreaming={isStoryStreaming}
              languageMode={languageMode}
              onToggleLanguageMode={handleToggleLanguageMode}
            />

            {/* Real-time Interactive Q&A (Tiki-taka) */}
            <ChatSection
              character={currentCharacter}
              poi={currentPOI}
              messages={messages}
              isReplying={isReplying}
              agentChatStatus={agentChatStatus}
              onSendMessage={handleSendMessage}
            />
          </section>
        </div>
      </main>

      {/* Manual POI Explore Modal */}
      <POICarousel
        isOpen={isPOIListOpen}
        onClose={() => setIsPOIListOpen(false)}
        selectedPOIId={currentPOI.id}
        onSelectPOI={(poi) => applyPOI(poi)}
      />

      {/* Real-time A/B Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        userLat={userLocation.lat}
        userLng={userLocation.lng}
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
