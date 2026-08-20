import React, { useState, useEffect, useRef, useCallback } from 'react';
import { POI, Character, ChatMessage } from './types/docent';
import { POI_LIST } from './data/poiData';
import { CHARACTERS } from './data/characters';
import { findNearestPOI, formatDistance } from './utils/geo';
import { geminiService } from './services/geminiService';
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
  const [currentPOI, setCurrentPOI] = useState<POI>(POI_LIST[0]);
  const [currentCharacter, setCurrentCharacter] = useState<Character>(
    CHARACTERS[POI_LIST[0].assignedCharacterId]
  );
  const [distanceText, setDistanceText] = useState('80m 앞');

  // Story & Streaming
  const [storyText, setStoryText] = useState('');
  const [isStoryStreaming, setIsStoryStreaming] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReplying, setIsReplying] = useState(false);

  // Modals
  const [isPOIListOpen, setIsPOIListOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isGPSModalOpen, setIsGPSModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const isInitialStoryStarted = useRef(false);

  // Zero-Click Story Generator
  const triggerZeroClickStory = useCallback(async (poi: POI, character: Character) => {
    setIsStoryStreaming(true);
    setStoryText('');
    setMessages([]);

    try {
      const res = await geminiService.generateSnackStory(poi, character, (chunk) => {
        setStoryText((prev) => prev + chunk);
      });
      setStoryText(res.text);
    } catch (err) {
      console.error('Error generating story:', err);
    } finally {
      setIsStoryStreaming(false);
    }
  }, []);

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

    triggerZeroClickStory(poi, assignedChar);
  }, [triggerZeroClickStory]);

  // Request Real Device GPS
  const handleUseRealGPS = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          console.log(`[GPS 수신 성공] 위도: ${lat}, 경도: ${lng}, 정확도: ±${accuracy}m`);

          setUserLocation({ lat, lng });
          setIsGpsActive(true);
          setGpsLabel('실제 기기 GPS');

          const { poi, distanceMeters } = findNearestPOI(lat, lng);
          applyPOI(poi, distanceMeters);
        },
        (err) => {
          console.warn('[GPS 수신 실패 또는 거부]:', err);
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

  // Handle user chat message
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsReplying(true);

    const modelMsgId = `model-${Date.now()}`;
    let accumulatedModelText = '';

    try {
      const res = await geminiService.sendChatMessage(
        currentPOI,
        currentCharacter,
        text,
        [...messages, userMsg],
        (chunk) => {
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
        }
      );

      // Finalize
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== modelMsgId);
        return [
          ...filtered,
          {
            id: modelMsgId,
            sender: 'model',
            text: res.text || accumulatedModelText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            characterId: currentCharacter.id
          }
        ];
      });
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="app-shell">
      <Header
        currentPlaceName={currentPOI.name}
        gpsLabel={gpsLabel}
        onOpenPOIList={() => setIsPOIListOpen(true)}
        onOpenGPSSimulator={() => setIsGPSModalOpen(true)}
        isGpsActive={isGpsActive}
      />

      <main className="main-content">
        <div className="content-container">
          {/* Official High-Resolution Photo Card */}
          <PhotoCard poi={currentPOI} distanceText={distanceText} />

          {/* Zero-Click 1st Person RAG Deep Story */}
          <StoryCard
            character={currentCharacter}
            poi={currentPOI}
            storyText={storyText}
            isStreaming={isStoryStreaming}
          />

          {/* Real-time Interactive Q&A (Tiki-taka) */}
          <ChatSection
            character={currentCharacter}
            poi={currentPOI}
            messages={messages}
            isReplying={isReplying}
            onSendMessage={handleSendMessage}
          />
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
