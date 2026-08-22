import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle,
  BookOpen,
  Bot,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  FileCheck
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

  useEffect(() => {
    document.title = 'Search → Docent Trace | 검색 자료와 도슨트 출력';
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

  const completedCount = Object.keys(results).length;

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
              <BookOpen size={18} />
            </div>
            <div className="lab-brand-text">
              <h1>질문에서 도슨트 답변까지</h1>
              <span>서치 자료 · 핵심 요약 · 할루시네이션 자동 점검</span>
            </div>
          </div>
        </div>

        <div className="lab-nav-right">
          <button
            type="button"
            className="lab-action-btn primary"
            onClick={handleRunAllTests}
            disabled={isBatchRunning}
          >
            {isBatchRunning ? (
              <>
                <RefreshCw size={14} className="spin" />
                <span>질문 실행 중 ({batchProgress.current}/{batchProgress.total})</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>10개 질문 전체 실행</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="lab-workspace">
        {/* Left Side: 10 Curated Hard Scenarios */}
        <aside className="lab-sidebar">
          <div className="sidebar-section-title">
            <FileCheck size={16} />
            <h2>실행 시나리오</h2>
            <span className="sidebar-progress">{completedCount}/{testCases.length}</span>
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
                    <span className={`sc-cat ${tc.flowType}`}>
                      {tc.flowType === 'initial-summary' ? '첫 진입 요약' : '후속 질문'}
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

        </aside>

        {/* Right Main: search material and docent output */}
        <section className="lab-inspector">
          <div className="inspector-head">
            <div className="inspector-head-info">
              <span className="inspector-poi-badge">📍 {currentTestCase.poiName}</span>
              <span className={`inspector-cat-badge ${currentTestCase.flowType}`}>
                {currentTestCase.flowType === 'initial-summary' ? '첫 진입 핵심 요약' : '챗봇 후속 질문'}
              </span>
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
                  <span>자료 검색·답변 생성 중...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>이 질문 실행</span>
                </>
              )}
            </button>
          </div>

          {/* Search → docent trace */}
          <div className="inspector-grid">
            {/* Search agent documents */}
            <div className="grid-col col-2">
              <div className="grid-col-header">
                <BookOpen size={16} className="text-blue" />
                <h4>1. 서치 에이전트가 찾은 자료</h4>
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
                    <p><strong>[이 질문 실행]</strong>을 누르면 서치 에이전트가 도슨트에게 전달한 자료가 여기에 표시됩니다.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Docent agent response */}
            <div className="grid-col col-3">
              <div className="grid-col-header">
                <Bot size={16} className="text-emerald" />
                <h4>2. 도슨트 에이전트 출력</h4>
              </div>
              <div className="grid-col-body">
                {currentResult ? (
                  <div className="agent-result-wrapper">
                    <div className="agent-output-prose">
                      {currentResult.agentAnswer.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                    <div className={`trace-check-panel ${currentResult.metrics.hallucinationDetected ? 'needs-review' : 'grounded'}`}>
                      <div className="trace-check-head">
                        {currentResult.metrics.hallucinationDetected ? <AlertTriangle size={17} /> : <ShieldCheck size={17} />}
                        <strong>할루시네이션 자동 점검</strong>
                        <span>{currentResult.metrics.hallucinationDetected ? '근거 누락 가능성 있음' : '검색 자료와 대체로 일치'}</span>
                      </div>
                      <div className="trace-score-row">
                        <span>자료 근거 점수</span>
                        <strong>{currentResult.metrics.factConsistencyScore}%</strong>
                      </div>
                      <div className="trace-facts">
                        <div>
                          <span className="trace-fact-label">확인된 핵심 항목</span>
                          <div className="trace-fact-tags">
                            {currentResult.metrics.matchedKeyFacts.map((fact) => <i key={fact}>✓ {fact}</i>)}
                            {currentResult.metrics.matchedKeyFacts.length === 0 && <em>없음</em>}
                          </div>
                        </div>
                        <div>
                          <span className="trace-fact-label">답변에서 빠진 항목</span>
                          <div className="trace-fact-tags missing">
                            {currentResult.metrics.missingKeyFacts.map((fact) => <i key={fact}>{fact}</i>)}
                            {currentResult.metrics.missingKeyFacts.length === 0 && <em>없음</em>}
                          </div>
                        </div>
                      </div>
                      <p>자동 점검은 검색 문서와 핵심 항목의 포함 여부를 비교한 참고 지표입니다.</p>
                    </div>
                  </div>
                ) : (
                  <div className="placeholder-state-box">
                    <Bot size={36} className="text-slate-light" />
                    <p>검색 자료를 전달받아 도슨트 에이전트가 생성한 최종 답변이 여기에 표시됩니다.</p>
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
