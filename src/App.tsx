import { useState, useEffect, useRef } from 'react'
import './App.css'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  speed: number | null
  timestamp: string
}

export default function App() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const watchIdRef = useRef<number | null>(null)

  const handleSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, altitude, speed } = position.coords
    setLocation({
      latitude,
      longitude,
      accuracy: parseFloat(accuracy.toFixed(1)),
      altitude: altitude !== null ? parseFloat(altitude.toFixed(1)) : null,
      speed: speed !== null ? parseFloat((speed * 3.6).toFixed(1)) : null, // Convert m/s to km/h
      timestamp: new Date(position.timestamp).toLocaleTimeString(),
    })
    setLoading(false)
    setError(null)
  }

  const handleError = (err: GeolocationPositionError) => {
    setLoading(false)
    setIsTracking(false)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError('위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.')
        break
      case err.POSITION_UNAVAILABLE:
        setError('위치 정보를 사용할 수 없습니다. GPS 신호를 확인해 주세요.')
        break
      case err.TIMEOUT:
        setError('위치 정보를 가져오는 데 시간이 초과되었습니다.')
        break
      default:
        setError('알 수 없는 오류가 발생했습니다.')
        break
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 GPS(Geolocation) API를 지원하지 않습니다.')
      return
    }

    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  }

  const toggleTracking = () => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 GPS(Geolocation) API를 지원하지 않습니다.')
      return
    }

    if (isTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      setIsTracking(false)
    } else {
      // Start tracking
      setLoading(true)
      setError(null)
      setIsTracking(true)
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      })
    }
  }

  const copyToClipboard = () => {
    if (!location) return
    const text = `위도(Latitude): ${location.latitude}, 경도(Longitude): ${location.longitude}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">📍</div>
        <h1>GPS 실시간 위치 측정기</h1>
        <p className="subtitle">
          기기의 GPS 수신기를 통해 현재 좌표와 세부 위치 정보를 정밀하게 측정합니다.
        </p>
      </header>

      <main className="app-main">
        <div className="controls">
          <button 
            onClick={getLocation} 
            disabled={loading && !isTracking}
            className={`btn btn-primary ${loading && !isTracking ? 'loading' : ''}`}
          >
            {loading && !isTracking ? '위치 측정 중...' : '현재 위치 단발 측정'}
          </button>

          <button 
            onClick={toggleTracking} 
            className={`btn ${isTracking ? 'btn-active' : 'btn-secondary'}`}
          >
            {isTracking ? (
              <>
                <span className="live-dot"></span> 실시간 추적 중지
              </>
            ) : (
              '실시간 연속 추적 시작'
            )}
          </button>
        </div>

        {error && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
          </div>
        )}

        {loading && !location && !error && (
          <div className="radar-container">
            <div className="radar">
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="pointer"></div>
            </div>
            <p className="radar-text">GPS 신호를 수신 중입니다...</p>
          </div>
        )}

        {location && (
          <div className={`result-card ${isTracking ? 'tracking-glow' : ''}`}>
            {isTracking && (
              <div className="live-badge">
                <span className="live-dot pulsating"></span> LIVE Tracking
              </div>
            )}
            
            <h2 className="card-title">내 위치 데이터</h2>
            
            <div className="grid-container">
              <div className="grid-item">
                <span className="grid-label">위도 (Latitude)</span>
                <span className="grid-value highlight">{location.latitude}°</span>
              </div>
              <div className="grid-item">
                <span className="grid-label">경도 (Longitude)</span>
                <span className="grid-value highlight">{location.longitude}°</span>
              </div>
              <div className="grid-item">
                <span className="grid-label">오차 범위 (Accuracy)</span>
                <span className="grid-value">±{location.accuracy}m</span>
              </div>
              <div className="grid-item">
                <span className="grid-label">고도 (Altitude)</span>
                <span className="grid-value">
                  {location.altitude !== null ? `${location.altitude}m` : '측정 불가'}
                </span>
              </div>
              <div className="grid-item">
                <span className="grid-label">이동 속도 (Speed)</span>
                <span className="grid-value">
                  {location.speed !== null ? `${location.speed} km/h` : '정지 상태'}
                </span>
              </div>
              <div className="grid-item">
                <span className="grid-label">마지막 업데이트</span>
                <span className="grid-value">{location.timestamp}</span>
              </div>
            </div>

            <div className="card-actions">
              <button onClick={copyToClipboard} className="btn-action btn-copy">
                {copied ? '✅ 복사 완료!' : '📋 좌표 복사'}
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-action btn-map"
              >
                🗺️ 구글 지도에서 보기
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 Docent-in-hand. All rights reserved.</p>
        <p className="footer-note">※ 최적의 정확도를 위해 기기의 GPS 센서 및 브라우저의 위치 서비스를 활성화해 주세요.</p>
      </footer>
    </div>
  )
}
