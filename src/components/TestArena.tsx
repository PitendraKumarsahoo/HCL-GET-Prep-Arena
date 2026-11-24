import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type {
  CodingProblem,
  McqQuestion,
  TestAttemptRecord,
} from '../types/prep';
import { useTimer, formatSeconds } from '../hooks/useTimer';

export interface ActiveTestConfig {
  mode: 'cognitive' | 'technical' | 'full-mock' | 'retry-wrong';
  setId: string;
  title: string;
  durationMinutes: number;
  questions: McqQuestion[];
  codingProblems?: [CodingProblem, CodingProblem];
}

interface TestArenaProps {
  config: ActiveTestConfig;
  theme: 'light' | 'dark';
  bookmarkedIds: string[];
  onToggleBookmark: (questionId: string) => void;
  onComplete: (
    attempt: TestAttemptRecord,
    questionsMap: Record<string, McqQuestion>
  ) => void;
  onExit: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  quant: 'Quantitative',
  reasoning: 'Logical Reasoning',
  verbal: 'Verbal Ability',
  technical: 'Technical MCQ',
  coding: 'Coding (2)',
};

export function TestArena({
  config,
  theme,
  bookmarkedIds,
  onToggleBookmark,
  onComplete,
  onExit,
}: TestArenaProps) {
  const totalMcqs = config.questions.length;
  const codingList = config.codingProblems ?? [];
  const totalItems = totalMcqs + codingList.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({ 0: true });
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Embedded coding state for Full Mocks (Q74-Q75)
  const [codingLang, setCodingLang] = useState<'java' | 'python'>('java');
  const [codingCode, setCodingCode] = useState<Record<string, string>>({});
  const [codingOutput, setCodingOutput] = useState<Record<string, string>>({});
  const [codingRunning, setCodingRunning] = useState(false);
  const [showCodingSol, setShowCodingSol] = useState<Record<string, boolean>>({});

  const lastTickIdxRef = useRef(0);
  const submittedRef = useRef(false);

  // Track per-question active time
  useEffect(() => {
    lastTickIdxRef.current = currentIdx;
    setVisited((prev) => (prev[currentIdx] ? prev : { ...prev, [currentIdx]: true }));
  }, [currentIdx]);

  const handleFinish = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const questionsMap: Record<string, McqQuestion> = {};
    const topicBreakdown: Record<string, { correct: number; total: number }> = {};
    const wrongQuestionIds: string[] = [];

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const questionResults = config.questions.map((q) => {
      questionsMap[q.id] = q;
      const selected = answers[q.id] ?? null;
      const isCorrect = selected !== null && selected === q.correctIndex;

      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = { correct: 0, total: 0 };
      }
      topicBreakdown[q.topic].total += 1;

      if (selected === null) {
        unansweredCount += 1;
      } else if (isCorrect) {
        correctCount += 1;
        topicBreakdown[q.topic].correct += 1;
      } else {
        wrongCount += 1;
        wrongQuestionIds.push(q.id);
      }

      return {
        questionId: q.id,
        selectedIndex: selected,
        correctIndex: q.correctIndex,
        timeSpentSec: timeSpent[q.id] ?? 0,
        isCorrect,
      };
    });

    const rawScore = negativeMarking
      ? Number((correctCount - wrongCount * 0.25).toFixed(2))
      : correctCount;

    const totalTimeSec = Object.values(timeSpent).reduce((a, b) => a + b, 0);

    const attempt: TestAttemptRecord = {
      id: `att-${Date.now()}`,
      mode: config.mode,
      setId: config.setId,
      title: config.title,
      timestamp: Date.now(),
      score: Math.max(0, rawScore),
      totalQuestions: totalMcqs,
      correctCount,
      wrongCount,
      unansweredCount,
      negativeMarking,
      totalTimeSec,
      topicBreakdown,
      wrongQuestionIds,
      questionResults,
    };

    onComplete(attempt, questionsMap);
  }, [answers, config, negativeMarking, onComplete, timeSpent, totalMcqs]);

  const timer = useTimer({
    initialSeconds: config.durationMinutes * 60,
    autoStart: true,
    onExpire: handleFinish,
  });

  // Increment per-question seconds while timer runs
  useEffect(() => {
    if (!timer.isRunning) return;
    const id = window.setInterval(() => {
      const idx = lastTickIdxRef.current;
      const q = config.questions[idx];
      if (!q) return;
      setTimeSpent((prev) => ({
        ...prev,
        [q.id]: (prev[q.id] ?? 0) + 1,
      }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer.isRunning, config.questions]);

  const isCodingSlide = currentIdx >= totalMcqs;
  const activeMcq = !isCodingSlide ? config.questions[currentIdx] : null;
  const activeCoding = isCodingSlide ? codingList[currentIdx - totalMcqs] : null;

  // Keyboard shortcuts (disabled while typing inside Monaco editor)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('.monaco-editor'))
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        setCurrentIdx((i) => Math.min(totalItems - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        setCurrentIdx((i) => Math.max(0, i - 1));
      } else if (activeMcq) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = Number(e.key) - 1;
          setAnswers((prev) => ({ ...prev, [activeMcq.id]: optIdx }));
        } else if (e.key.toLowerCase() === 'm') {
          setMarked((prev) => ({ ...prev, [activeMcq.id]: !prev[activeMcq.id] }));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMcq, totalItems]);

  // Sectional jump anchors for Cognitive & Full Mock
  const sectionTabs = useMemo(() => {
    const tabs: Array<{ key: string; label: string; startIndex: number; count: number }> = [];
    const seen = new Map<string, number>();
    config.questions.forEach((q, idx) => {
      const key = q.section ?? (config.mode === 'full-mock' ? 'technical' : 'all');
      if (!seen.has(key)) {
        seen.set(key, tabs.length);
        tabs.push({
          key,
          label: SECTION_LABELS[key] ?? q.topic,
          startIndex: idx,
          count: 1,
        });
      } else {
        tabs[seen.get(key)!].count += 1;
      }
    });
    if (codingList.length > 0) {
      tabs.push({
        key: 'coding',
        label: 'Coding (2)',
        startIndex: totalMcqs,
        count: codingList.length,
      });
    }
    return tabs;
  }, [config.questions, config.mode, codingList.length, totalMcqs]);

  const answeredCount = useMemo(
    () => config.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).length,
    [config.questions, answers]
  );

  const runMockCodingSample = async (problem: CodingProblem) => {
    setCodingRunning(true);
    const code = codingCode[`${problem.id}:${codingLang}`] ?? problem.starterCode[codingLang];
    const sample = problem.testCases[0];
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: codingLang === 'java' ? 'java' : 'python',
          version: '*',
          files: [{ name: codingLang === 'java' ? 'Main.java' : 'main.py', content: code }],
          stdin: sample.input,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const out = (data?.run?.stdout ?? '').trim();
      const err = (data?.run?.stderr ?? data?.compile?.stderr ?? '').trim();
      if (err) {
        setCodingOutput((p) => ({ ...p, [problem.id]: `Error:\n${err}` }));
      } else {
        const pass = out === sample.expectedOutput.trim();
        setCodingOutput((p) => ({
          ...p,
          [problem.id]: `${pass ? 'PASS' : 'MISMATCH'} on Sample 1\nExpected: ${sample.expectedOutput}\nActual:   ${out}`,
        }));
      }
    } catch {
      setCodingOutput((p) => ({
        ...p,
        [problem.id]:
          'Remote Piston sandbox unavailable or rate-limited in this browser session. You can toggle "Show Reference Solution" below to inspect Java & Python solutions.',
      }));
    } finally {
      setCodingRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Runner Status & Controls Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {config.mode === 'full-mock'
              ? 'Full Mock Simulation'
              : config.mode === 'retry-wrong'
              ? 'Weak-Area Retry Session'
              : 'Timed Practice Set'}
          </p>
          <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {config.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={negativeMarking}
              onChange={(e) => setNegativeMarking(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-700"
            />
            -0.25 Negative Marking
          </label>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold tabular-nums ${
              timer.secondsLeft < 300
                ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300'
                : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timer.formatted}</span>
          </div>

          <button
            type="button"
            onClick={timer.toggle}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {timer.isRunning ? 'Pause' : 'Resume'}
          </button>

          <button
            type="button"
            onClick={() => setConfirmSubmit(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap"
          >
            Submit Test
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer whitespace-nowrap"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Sectional Jump Tabs (when multiple sections exist) */}
      {sectionTabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl">
          {sectionTabs.map((tab) => {
            const isActive =
              currentIdx >= tab.startIndex && currentIdx < tab.startIndex + tab.count;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCurrentIdx(tab.startIndex)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Split Workspace: Question Viewport + Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          {activeMcq && (
            <div>
              {/* Quiet unboxed metadata line (Zero-Pill) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Question {currentIdx + 1} of {totalItems}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMcq.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMcq.subtopic}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{activeMcq.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeMcq.source_tag === 'reported' ? 'Reported pattern' : 'PYQ-style'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatSeconds(timeSpent[activeMcq.id] ?? 0)} spent</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMarked((prev) => ({
                        ...prev,
                        [activeMcq.id]: !prev[activeMcq.id],
                      }))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
                      marked[activeMcq.id]
                        ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {marked[activeMcq.id] ? 'Marked' : 'Mark Review'}
                  </button>

                  <button
                    type="button"
                    aria-label="Bookmark question"
                    onClick={() => onToggleBookmark(activeMcq.id)}
                    className={`p-1.5 rounded-md border cursor-pointer transition-colors ${
                      bookmarkedIds.includes(activeMcq.id)
                        ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Optional Reading Comprehension Passage */}
              {activeMcq.passage && (
                <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Reading Passage
                  </p>
                  {activeMcq.passage}
                </div>
              )}

              {/* Question Text */}
              <div className="mt-5 text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-line">
                {activeMcq.question}
              </div>

              {/* Optional Code Snippet */}
              {activeMcq.codeSnippet && (
                <pre className="mt-4 p-4 rounded-lg bg-slate-950 text-slate-100 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
                  <code>{activeMcq.codeSnippet}</code>
                </pre>
              )}

              {/* 4 Options */}
              <div className="mt-6 space-y-2.5">
                {activeMcq.options.map((opt, oIdx) => {
                  const selected = answers[activeMcq.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [activeMcq.id]: oIdx,
                        }))
                      }
                      className={`w-full text-left p-3.5 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer ${
                        selected
                          ? 'border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/50 text-slate-900 dark:text-slate-100'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                          selected
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {oIdx + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer Nav & Shortcuts */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={answers[activeMcq.id] === undefined || answers[activeMcq.id] === null}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [activeMcq.id]: null }))
                    }
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                  >
                    Clear Response
                  </button>
                  <span className="hidden sm:inline text-xs text-slate-400">
                    Keys: 1–4 select · M mark · N/P navigate
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentIdx >= totalItems - 1}
                    onClick={() => setCurrentIdx((i) => Math.min(totalItems - 1, i + 1))}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Embedded Coding Problem Slide in Full Mock */}
          {activeCoding && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coding Question {currentIdx - totalMcqs + 1} of {codingList.length} ·{' '}
                    {activeCoding.topic} · {activeCoding.difficulty}
                  </p>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeCoding.title}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {(['java', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCodingLang(lang)}
                      className={`px-3 py-1 text-xs font-medium rounded-md capitalize cursor-pointer ${
                        codingLang === lang
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {activeCoding.statement}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Sample Input</p>
                  <pre className="mt-1 font-mono text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                    {activeCoding.testCases[0]?.input}
                  </pre>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Expected Output</p>
                  <pre className="mt-1 font-mono text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                    {activeCoding.testCases[0]?.expectedOutput}
                  </pre>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <Editor
                  height="280px"
                  language={codingLang}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  value={
                    codingCode[`${activeCoding.id}:${codingLang}`] ??
                    activeCoding.starterCode[codingLang]
                  }
                  onChange={(val) =>
                    setCodingCode((prev) => ({
                      ...prev,
                      [`${activeCoding.id}:${codingLang}`]: val ?? '',
                    }))
                  }
                  options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={codingRunning}
                    onClick={() => runMockCodingSample(activeCoding)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {codingRunning ? 'Running Sample...' : 'Run Sample Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCodingSol((p) => ({
                        ...p,
                        [activeCoding.id]: !p[activeCoding.id],
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    {showCodingSol[activeCoding.id] ? 'Hide Solution' : 'Reveal Reference Solution'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentIdx >= totalItems - 1}
                    onClick={() => setCurrentIdx((i) => Math.min(totalItems - 1, i + 1))}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

              {codingOutput[activeCoding.id] && (
                <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap">
                  {codingOutput[activeCoding.id]}
                </pre>
              )}

              {showCodingSol[activeCoding.id] && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Reference ({codingLang.toUpperCase()}) · {activeCoding.timeComplexity} ·{' '}
                    {activeCoding.spaceComplexity}
                  </p>
                  <pre className="p-3 rounded bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                    <code>{activeCoding.solutions[codingLang]}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Question Palette
            </h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {answeredCount} / {totalMcqs} answered
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2 max-h-[340px] overflow-y-auto pr-1">
            {config.questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
              const isMarked = !!marked[q.id];
              const isVisited = !!visited[idx];

              let colorClass =
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
              if (isMarked) {
                colorClass =
                  'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700';
              } else if (isAnswered) {
                colorClass =
                  'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700';
              } else if (isVisited) {
                colorClass =
                  'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500';
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg border text-xs font-mono font-semibold tabular-nums cursor-pointer transition-transform ${colorClass} ${
                    isCurrent ? 'ring-2 ring-blue-600 ring-offset-1 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}

            {codingList.map((p, cIdx) => {
              const idx = totalMcqs + cIdx;
              const isCurrent = idx === currentIdx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg border text-xs font-mono font-semibold tabular-nums cursor-pointer bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 ${
                    isCurrent ? 'ring-2 ring-blue-600 ring-offset-1 dark:ring-offset-slate-900' : ''
                  }`}
                >
                  C{cIdx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Marked ({Object.values(marked).filter(Boolean).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Unanswered ({totalMcqs - answeredCount})</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Submit Test & View Analysis?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed tabular-nums">
              You have answered {answeredCount} of {totalMcqs} MCQs ({totalMcqs - answeredCount}{' '}
              unanswered). Time remaining: {timer.formatted}.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSubmit(false);
                  handleFinish();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
