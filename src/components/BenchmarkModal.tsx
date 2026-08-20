import React, { useState } from 'react';
import { BenchmarkMetrics } from '../types/docent';
import { BenchmarkService } from '../services/benchmarkService';
import { X, Zap, Cpu, Clock, HardDrive, Play } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [metricsA, setMetricsA] = useState<BenchmarkMetrics>({
    engine: 'engine_a',
    engineName: 'Engine A (경량 JSON In-Memory Index)',
    searchLatencyMs: 14.2,
    ttftMs: 120,
    totalLatencyMs: 540,
    memoryEstimateKb: 180
  });

  const [metricsB, setMetricsB] = useState<BenchmarkMetrics>({
    engine: 'engine_b',
    engineName: 'Engine B (Vertex AI Vector Search)',
    searchLatencyMs: 335.8,
    ttftMs: 360,
    totalLatencyMs: 820,
    memoryEstimateKb: 4620
  });

  if (!isOpen) return null;

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const resA = await BenchmarkService.runEngineA(userLat, userLng);
      const resB = await BenchmarkService.runEngineB(userLat, userLng);
      setMetricsA(resA.metrics);
      setMetricsB(resB.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const speedupRatio = (metricsB.searchLatencyMs / (metricsA.searchLatencyMs || 1)).toFixed(1);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet benchmark-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="title-with-badge">
              <Zap size={20} className="zap-icon" />
              <h3>검색 엔진 실시간 A/B 벤치마크</h3>
            </div>
            <p>경량 인덱스 매칭(Engine A)과 임베딩 벡터 검색(Engine B) 성능 비교</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Speedup Highlight Banner */}
        <div className="speedup-banner">
          <span className="speedup-badge">🚀 Engine A 속도 혁신</span>
          <p className="speedup-text">
            경량 JSON In-Memory 방식이 벡터 검색 대비 <strong>약 {speedupRatio}배 더 빠른 검색 속도</strong>를 제공합니다.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="benchmark-grid">
          {/* Card A */}
          <div className="benchmark-card engine-a-card">
            <div className="card-header-row">
              <span className="engine-chip engine-a-chip">추천 (Engine A)</span>
              <span className="engine-target">경량 In-Memory Index</span>
            </div>

            <div className="metrics-list">
              <div className="metric-row">
                <div className="metric-label">
                  <Clock size={14} />
                  <span>검색 지연시간</span>
                </div>
                <span className="metric-value highlight-green">
                  {metricsA.searchLatencyMs.toFixed(1)} ms
                </span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <Cpu size={14} />
                  <span>첫 토큰 생성(TTFT)</span>
                </div>
                <span className="metric-value">{metricsA.ttftMs} ms</span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <Zap size={14} />
                  <span>전체 응답 시간</span>
                </div>
                <span className="metric-value">{metricsA.totalLatencyMs} ms</span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <HardDrive size={14} />
                  <span>메모리 사용량</span>
                </div>
                <span className="metric-value highlight-green">
                  ~{metricsA.memoryEstimateKb} KB
                </span>
              </div>
            </div>
            <div className="engine-desc">
              GCS `poi_index.json` 단일 인메모리 로드로 3~5초 대기시간 사용자에게 즉시 응답 제공.
            </div>
          </div>

          {/* Card B */}
          <div className="benchmark-card engine-b-card">
            <div className="card-header-row">
              <span className="engine-chip engine-b-chip">비교군 (Engine B)</span>
              <span className="engine-target">Vertex AI Vector Search</span>
            </div>

            <div className="metrics-list">
              <div className="metric-row">
                <div className="metric-label">
                  <Clock size={14} />
                  <span>검색 지연시간</span>
                </div>
                <span className="metric-value highlight-amber">
                  {metricsB.searchLatencyMs.toFixed(1)} ms
                </span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <Cpu size={14} />
                  <span>첫 토큰 생성(TTFT)</span>
                </div>
                <span className="metric-value">{metricsB.ttftMs} ms</span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <Zap size={14} />
                  <span>전체 응답 시간</span>
                </div>
                <span className="metric-value">{metricsB.totalLatencyMs} ms</span>
              </div>

              <div className="metric-row">
                <div className="metric-label">
                  <HardDrive size={14} />
                  <span>메모리 사용량</span>
                </div>
                <span className="metric-value">
                  ~{(metricsB.memoryEstimateKb / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
            <div className="engine-desc">
              임베딩 생성 및 코사인 유사도 연산으로 자연어 탐색이 가능하나 모바일 대기시간에는 지연 발생.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="benchmark-action-row">
          <button
            type="button"
            className="btn-run-benchmark"
            onClick={handleRunBenchmark}
            disabled={isRunning}
          >
            <Play size={16} />
            <span>{isRunning ? '실시간 벤치마크 측정 중...' : '실시간 A/B 벤치마크 재측정'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
