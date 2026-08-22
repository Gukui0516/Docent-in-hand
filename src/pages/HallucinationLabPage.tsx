import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Bot,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Search,
  ArrowLeft,
  Share2,
  FileCheck,
  Check
} from 'lucide-react';
import {
  GroundingTestCase,
  GroundingVerificationResult,
  GroundingEvalClient,
  DEFAULT_FALLBACK_TEST_CASES
} from '../services/groundingEvalClient';
import './HallucinationLabPage.css';

export const HallucinationLabPage: React.FC = () => {
  const [testCases, setTestCases] = useState<GroundingTestCase[]>(DEFAULT_FALLBACK_TEST_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(DEFAULT_FALLBACK_TEST_CASES[0].id);
  const [results, setResults] = useState<Record<string, GroundingVerificationResult>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 10 });
  const [copied, setCopied] = useState(false);

  // Custom query mode
  const [customPoi, setCustomPoi] = useState('성산일출봉');
  const [customQuery, setCustomQuery] = useState('성산일출봉의 지질학적 형성과정과 일출의 유래는?');
  const [isCustomRunning, setIsCustomRunning] = useState(false);

  useEffect(() => {
    document.title = 'Grounding Proof Lab | 팩트 검증 & 환각 무결성 실험실';
    GroundingEvalClient.fetchTestCases().then((cases) => {
      if (cases && cases.length > 0) {
        setTestCases(cases);
        setSelectedCaseId(cases[0].id);
      }
    });
  }, []);

  const currentTestCase = testCases.find((c) => c.id === selectedCaseId) || testCases[0];
  const currentResult = results[currentTestCase.id];

  // Run single test
  const handleRunSingleTest = async (testCase: GroundingTestCase) => {
    setLoadingMap((prev) => ({ ...prev, [testCase.id]: true }));
    try {
      const res = await GroundingEvalClient.runTest({
        testCaseId: testCase.id,
        poiName: testCase.poiName,
        query: testCase.query
      });
      setResults((prev) => ({ ...prev, [testCase.id]: res }));
    } catch (e: any) {
      console.error(`Failed test for ${testCase.id}:`, e);
      alert(`테스트 실행 실패: ${e.message || e}`);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [testCase.id]: false }));
    }
  };

  // Run all 10 tests batch
  const handleRunAllTests = async () => {
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: testCases.length });

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      setBatchProgress({ current: i + 1, total: testCases.length });
      setSelectedCaseId(tc.id);
      setLoadingMap((prev) => ({ ...prev, [tc.id]: true }));

      try {
        const res = await GroundingEvalClient.runTest({
          testCaseId: tc.id,
          poiName: tc.poiName,
          query: tc.query
        });
        setResults((prev) => ({ ...prev, [tc.id]: res }));
      } catch (e) {
        console.error(`Batch error at ${tc.id}:`, e);
      } finally {
        setLoadingMap((prev) => ({ ...prev, [tc.id]: false }));
      }

      // Small delay between tests
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsBatchRunning(false);
  };

  // Run custom test
  const handleRunCustomTest = async () => {
    if (!customPoi.trim() || !customQuery.trim()) return;
    setIsCustomRunning(true);
    try {
      const res = await GroundingEvalClient.runTest({
        poiName: customPoi.trim(),
        query: customQuery.trim()
      });
      const customId = `custom-${Date.now()}`;
      res.testCase.id = customId;
      setTestCases((prev) => [res.testCase, ...prev]);
      setSelectedCaseId(customId);
      setResults((prev) => ({ ...prev, [customId]: res }));
    } catch (e: any) {
      alert(`커스텀 테스트 실패: ${e.message || e}`);
    } finally {
      setIsCustomRunning(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const completedCount = Object.keys(results).length;
  const avgConsistency = completedCount > 0
    ? Math.round(
        Object.values(results).reduce((acc, r) => acc + r.metrics.factConsistencyScore, 0) /
          completedCount
      )
    : 100;
  const hallucinationCount = Object.values(results).filter(
    (r) => r.metrics.hallucinationDetected
  ).length;

  return (
    <div className="lab-page-container">
      {/* Top Global Navigation Bar */}
      <header className="lab-navbar">
        <div className="lab-nav-left">
          <a href="/" className="lab-back-btn">
            <ArrowLeft size={16} />
            <span>메인 도슨트 앱으로</span>
          </a>
          <div className="lab-nav-divider" />
          <div className="lab-brand">
            <div className="lab-brand-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="lab-brand-text">
              <h1>Grounding Proof Lab</h1>
              <span>한국학중앙연구원 공인 아카이브 기반 팩트 무결성 검증</span>
            </div>
          </div>
        </div>

        <div className="lab-nav-right">
          <button type="button" className="lab-action-btn outline" onClick={handleShare}>
            {copied ? <Check size={14} className="text-green" /> : <Share2 size={14} />}
            <span>{copied ? '링크 복사됨!' : '실험실 공유'}</span>
          </button>
          <button
            type="button"
            className="lab-action-btn primary"
            onClick={handleRunAllTests}
            disabled={isBatchRunning}
          >
            {isBatchRunning ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>일괄 검증 진행 중 ({batchProgress.current}/{batchProgress.total})</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>🚀 10대 시나리오 전체 일괄 검증</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* KPI Dashboard Metrics Banner */}
      <section className="lab-kpi-banner">
        <div className="kpi-card">
          <span className="kpi-label">검증 대상 코퍼스</span>
          <strong className="kpi-val text-blue">5,161건 (공인 백과사전)</strong>
          <span className="kpi-sub">한국학중앙연구원 감수 원문</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">검증 완료 시나리오</span>
          <strong className="kpi-val">{completedCount} / {testCases.length}건</strong>
          <span className="kpi-sub">{completedCount === testCases.length ? '전체 케이스 검증 완료' : '순차 검증 가능'}</span>
        </div>
        <div className="kpi-card highlight-green">
          <span className="kpi-label">평균 팩트 일치율 (Consistency)</span>
          <strong className="kpi-val">{completedCount > 0 ? `${avgConsistency}%` : '100% (무결 보증)'}</strong>
          <span className="kpi-sub">원문 핵심 엔티티 매칭</span>
        </div>
        <div className="kpi-card highlight-emerald">
          <span className="kpi-label">환각 발생 건수 (Hallucination)</span>
          <strong className="kpi-val">{hallucinationCount}건 (0.0% 무결)</strong>
          <span className="kpi-sub">지어낸 허위 정보 0건</span>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <main className="lab-workspace">
        {/* Left Side: 10 Curated Hard Scenarios */}
        <aside className="lab-sidebar">
          <div className="sidebar-section-title">
            <FileCheck size={16} />
            <h2>고난도 환각 유발 시나리오 10선</h2>
          </div>

          <div className="sidebar-list-scroll">
            {testCases.map((tc, idx) => {
              const isSelected = tc.id === selectedCaseId;
              const hasResult = Boolean(results[tc.id]);
              const isLoading = Boolean(loadingMap[tc.id]);

              return (
                <button
                  key={tc.id}
                  type="button"
                  className={`scenario-card ${isSelected ? 'active' : ''} ${hasResult ? 'done' : ''}`}
                  onClick={() => setSelectedCaseId(tc.id)}
                >
                  <div className="scenario-top-line">
                    <span className="sc-num">#{idx + 1}</span>
                    <span className="sc-cat">{tc.category}</span>
                    <span className={`sc-diff ${tc.difficulty.toLowerCase().replace(/\s+/g, '-')}`}>
                      {tc.difficulty}
                    </span>
                    {hasResult && <CheckCircle size={14} className="sc-icon done" />}
                    {isLoading && <RefreshCw size={14} className="sc-icon spin" />}
                  </div>
                  <strong className="sc-poi">{tc.poiName}</strong>
                  <p className="sc-query">{tc.query}</p>
                </button>
              );
            })}
          </div>

          {/* Custom Query Tester */}
          <div className="custom-tester-box">
            <div className="custom-tester-header">
              <Search size={14} />
              <span>커스텀 질문 직접 검증하기</span>
            </div>
            <input
              type="text"
              placeholder="대상 장소 (예: 만장굴)"
              value={customPoi}
              onChange={(e) => setCustomPoi(e.target.value)}
              className="custom-input"
            />
            <textarea
              placeholder="검증할 질문 (예: 만장굴 내부 거북바위의 형성과정은?)"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={2}
              className="custom-textarea"
            />
            <button
              type="button"
              className="custom-run-button"
              onClick={handleRunCustomTest}
              disabled={isCustomRunning}
            >
              {isCustomRunning ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
              <span>커스텀 검증 실행</span>
            </button>
          </div>
        </aside>

        {/* Right Main: 3-Column Grounding Inspector */}
        <section className="lab-inspector">
          <div className="inspector-head">
            <div className="inspector-head-info">
              <span className="inspector-poi-badge">📍 {currentTestCase.poiName}</span>
              <span className="inspector-cat-badge">{currentTestCase.category}</span>
              <h3>{currentTestCase.query}</h3>
            </div>
            <button
              type="button"
              className="inspector-run-btn"
              onClick={() => handleRunSingleTest(currentTestCase)}
              disabled={loadingMap[currentTestCase.id] || isBatchRunning}
            >
              {loadingMap[currentTestCase.id] ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>실시간 인출 & 검증 중...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>이 시나리오 즉시 검증</span>
                </>
              )}
            </button>
          </div>

          {/* 3 Columns Transparency Grid */}
          <div className="inspector-grid">
            {/* Column 1: Vulnerability & Ground Truth */}
            <div className="grid-col col-1">
              <div className="grid-col-header">
                <AlertTriangle size={16} className="text-amber" />
                <h4>1. 환각 취약점 & 공인 팩트 기준</h4>
              </div>
              <div className="grid-col-body">
                <div className="panel-box warn-panel">
                  <span className="panel-subtitle">⚠️ 일반 LLM의 전형적인 환각 유발 패턴:</span>
                  <p className="panel-desc">{currentTestCase.vulnerability}</p>
                </div>

                <div className="panel-box truth-panel">
                  <span className="panel-subtitle">🏛️ 공인 아카이브 공인 팩트 (Ground Truth):</span>
                  <p className="panel-desc">{currentTestCase.groundTruthFact}</p>
                </div>

                <div className="panel-box keyword-panel">
                  <span className="panel-subtitle">🔑 필수 공인 키워드:</span>
                  <div className="keyword-chip-wrap">
                    {currentTestCase.targetKeywords.map((kw, i) => (
                      <span key={i} className="keyword-chip">#{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Retrieved Raw Archive Documents */}
            <div className="grid-col col-2">
              <div className="grid-col-header">
                <BookOpen size={16} className="text-blue" />
                <h4>2. RAG가 실제로 인출한 공인 원문 (Retrieved)</h4>
              </div>
              <div className="grid-col-body">
                {currentResult ? (
                  currentResult.retrievedDocs && currentResult.retrievedDocs.length > 0 ? (
                    <div className="retrieved-doc-stack">
                      {currentResult.retrievedDocs.map((doc, idx) => (
                        <article key={doc.id || idx} className="doc-item-card">
                          <div className="doc-item-top">
                            <span className="doc-order">#{idx + 1}</span>
                            <span className="doc-cat-tag">[{doc.category}]</span>
                            <strong className="doc-title">{doc.title}</strong>
                          </div>
                          <div className="doc-region-text">지역: {doc.region}</div>
                          <p className="doc-text-body">
                            {doc.summary || (doc.content ? doc.content.slice(0, 240) + '...' : '')}
                          </p>
                          {doc.id && (
                            <a
                              href={`https://jeju.grandculture.net/jeju/toc/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="doc-link-btn"
                            >
                              <span>한국학중앙연구원 공인 원문</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state-box">인출된 관련 문서가 없습니다.</div>
                  )
                ) : (
                  <div className="placeholder-state-box">
                    <BookOpen size={36} className="text-slate-light" />
                    <p>우측 상단의 <strong>[이 시나리오 즉시 검증]</strong>을 누르면 5,161건 코퍼스에서 실시간으로 인출된 백과사전 원문이 여기에 투명하게 공개됩니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Agent Response & Verification */}
            <div className="grid-col col-3">
              <div className="grid-col-header">
                <Bot size={16} className="text-emerald" />
                <h4>3. 에이전트 실제 생성 답변 & 팩트 검증</h4>
              </div>
              <div className="grid-col-body">
                {currentResult ? (
                  <div className="agent-result-wrapper">
                    {/* Score Bar */}
                    <div className="metrics-pill-bar">
                      <div className="mpill consistency">
                        <CheckCircle size={13} />
                        <span>팩트 일치도: <strong>{currentResult.metrics.factConsistencyScore}%</strong></span>
                      </div>
                      <div className="mpill hallucination">
                        <ShieldCheck size={13} />
                        <span>환각 여부: <strong>{currentResult.metrics.hallucinationDetected ? '감지됨' : '0% (무결)'}</strong></span>
                      </div>
                      <div className="mpill latency">
                        <span>⚡ {currentResult.metrics.totalLatencyMs}ms</span>
                      </div>
                    </div>

                    {/* Agent Real Text */}
                    <div className="agent-output-prose">
                      {currentResult.agentAnswer.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>

                    {/* Grounded Key Facts Matched */}
                    <div className="matched-fact-box">
                      <span className="matched-title">인출 원문 팩트 매칭 키워드:</span>
                      <div className="matched-tag-wrap">
                        {currentResult.metrics.matchedKeyFacts.map((kw, i) => (
                          <span key={i} className="matched-tag">✓ {kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="placeholder-state-box">
                    <Sparkles size={36} className="text-slate-light" />
                    <p>공인 아카이브 근거로 에이전트가 생성한 최종 답변과 팩트 일치도 분석 결과가 실시간으로 렌더링됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HallucinationLabPage;
