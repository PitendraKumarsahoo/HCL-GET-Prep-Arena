import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { CheckCircle2, Play, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { CODING_SETS } from '../data';
import { useTimer } from '../hooks/useTimer';
import type { CodingProblem } from '../types/prep';

interface CodingLabProps {
  theme: 'light' | 'dark';
  solvedIds: string[];
  onMarkSolved: (problemId: string, solved?: boolean) => void;
}

type Lang = 'java' | 'python' | 'cpp';

interface CaseResult {
  index: number;
  isSample: boolean;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const PISTON_LANG: Record<Lang, { language: string; filename: string }> = {
  java: { language: 'java', filename: 'Main.java' },
  python: { language: 'python', filename: 'main.py' },
  cpp: { language: 'c++', filename: 'main.cpp' },
};

async function executePiston(lang: Lang, code: string, stdin: string) {
  const cfg = PISTON_LANG[lang];
  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: cfg.language,
      version: '*',
      files: [{ name: cfg.filename, content: code }],
      stdin,
    }),
  });
  if (!res.ok) {
    throw new Error(`Sandbox returned HTTP ${res.status}`);
  }
  return res.json();
}

export function CodingLab({ theme, solvedIds, onMarkSolved }: CodingLabProps) {
  const [selectedSetIdx, setSelectedSetIdx] = useState(0);
  const [selectedProbIdx, setSelectedProbIdx] = useState<0 | 1>(0);
  const [lang, setLang] = useState<Lang>('java');
  const [codeByKey, setCodeByKey] = useState<Record<string, string>>({});
  const [customStdin, setCustomStdin] = useState('');
  const [customOutput, setCustomOutput] = useState<string | null>(null);
  const [caseResults, setCaseResults] = useState<CaseResult[] | null>(null);
  const [runnerNote, setRunnerNote] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [solutionLang, setSolutionLang] = useState<'java' | 'python' | null>(null);

  const activeSet = CODING_SETS[selectedSetIdx];
  const problem: CodingProblem = activeSet.problems[selectedProbIdx];
  const codeKey = `${problem.id}:${lang}`;
  const currentCode = codeByKey[codeKey] ?? problem.starterCode[lang];

  const timer = useTimer({
    initialSeconds: activeSet.durationMinutes * 60,
    autoStart: false,
  });

  const handleSelectSet = (idx: number) => {
    setSelectedSetIdx(idx);
    setSelectedProbIdx(0);
    setCaseResults(null);
    setCustomOutput(null);
    setRunnerNote(null);
    setSolutionLang(null);
    timer.reset(CODING_SETS[idx].durationMinutes * 60);
  };

  const handleSelectProb = (idx: 0 | 1) => {
    setSelectedProbIdx(idx);
    setCaseResults(null);
    setCustomOutput(null);
    setRunnerNote(null);
    setSolutionLang(null);
  };

  const handleRunCustom = async () => {
    setIsRunning(true);
    setRunnerNote(null);
    setCustomOutput(null);
    try {
      const data = await executePiston(
        lang,
        currentCode,
        customStdin || problem.testCases[0].input
      );
      const compileErr = (data?.compile?.stderr ?? '').trim();
      const stderr = (data?.run?.stderr ?? '').trim();
      const stdout = (data?.run?.stdout ?? '').trim();
      if (compileErr || stderr) {
        setCustomOutput(`Stderr:\n${compileErr || stderr}\n\nStdout:\n${stdout}`);
      } else {
        setCustomOutput(stdout || '(empty output)');
      }
    } catch (err) {
      setRunnerNote(
        `Remote sandbox unreachable (${err instanceof Error ? err.message : 'network error'}). Inspect the Java & Python reference solutions below or copy code into a local JDK/Python terminal.`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunning(true);
    setRunnerNote(null);
    setCaseResults(null);
    const results: CaseResult[] = [];
    try {
      for (let i = 0; i < problem.testCases.length; i++) {
        const tc = problem.testCases[i];
        const data = await executePiston(lang, currentCode, tc.input);
        const compileErr = (data?.compile?.stderr ?? '').trim();
        const runtimeErr = (data?.run?.stderr ?? '').trim();
        const actual = (data?.run?.stdout ?? '').trim().replace(/\r\n/g, '\n');
        const expected = tc.expectedOutput.trim().replace(/\r\n/g, '\n');

        if (compileErr) {
          results.push({
            index: i + 1,
            isSample: tc.isSample,
            passed: false,
            expected,
            actual: '',
            error: compileErr,
          });
          break;
        }
        results.push({
          index: i + 1,
          isSample: tc.isSample,
          passed: !runtimeErr && actual === expected,
          expected,
          actual,
          error: runtimeErr || undefined,
        });
      }
      setCaseResults(results);
      if (results.length === problem.testCases.length && results.every((r) => r.passed)) {
        onMarkSolved(problem.id, true);
      }
    } catch (err) {
      setRunnerNote(
        `Remote sandbox execution could not complete (${err instanceof Error ? err.message : 'rate-limited or offline'}). Use "Reference Solution" to verify logic & edge cases.`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const isSolved = solvedIds.includes(problem.id);

  return (
    <div className="space-y-5">
      {/* Set Selector & Timer Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Coding Set:
            <select
              value={selectedSetIdx}
              onChange={(e) => handleSelectSet(Number(e.target.value))}
              className="ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {CODING_SETS.map((s, idx) => (
                <option key={s.setId} value={idx}>
                  {s.title} ({s.durationMinutes}m)
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {activeSet.problems.map((p, pIdx) => {
              const solved = solvedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProb(pIdx as 0 | 1)}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    selectedProbIdx === pIdx
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {solved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  P{pIdx + 1}: {p.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold tabular-nums">
            <Clock className="w-3.5 h-3.5" /> {timer.formatted}
          </span>
          <button
            type="button"
            onClick={timer.toggle}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {timer.isRunning ? 'Pause' : 'Start Timer'}
          </button>
          <button
            type="button"
            onClick={() => onMarkSolved(problem.id, !isSolved)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
              isSolved
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isSolved ? 'Solved ✓' : 'Mark Solved'}
          </button>
        </div>
      </div>

      {/* Split Problem Statement + Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Statement, Constraints, Samples, Edge Cases */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {problem.topic} · {problem.subtopic} ·{' '}
              <span className="capitalize">{problem.difficulty}</span> ·{' '}
              {problem.source_tag === 'reported' ? 'Reported pattern' : 'PYQ-style'}
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              {problem.title}
            </h2>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
            {problem.statement}
          </p>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Input Format:{' '}
              </span>
              {problem.inputFormat}
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Output Format:{' '}
              </span>
              {problem.outputFormat}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Constraints
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs font-mono text-slate-600 dark:text-slate-300">
              {problem.constraints.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          {/* 2 Sample Cases */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Sample Test Cases (plus 5 hidden)
            </h3>
            {problem.testCases
              .filter((t) => t.isSample)
              .map((tc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Input {idx + 1}</p>
                      <pre className="mt-1 font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                        {tc.input}
                      </pre>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Output {idx + 1}</p>
                      <pre className="mt-1 font-mono text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                        {tc.expectedOutput}
                      </pre>
                    </div>
                  </div>
                  {tc.note && (
                    <p className="text-slate-500 dark:text-slate-400">{tc.note}</p>
                  )}
                </div>
              ))}
          </div>

          {/* Edge cases */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Target Complexity & Edge Cases
            </p>
            <p className="font-mono text-slate-600 dark:text-slate-300">
              Time: {problem.timeComplexity} · Space: {problem.spaceComplexity}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
              {problem.edgeCases.map((ec, i) => (
                <li key={i}>{ec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Monaco Editor + Test Results + Reference Solutions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['java', 'python', 'cpp'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                      lang === l
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {l === 'cpp' ? 'C++' : l === 'java' ? 'Java' : 'Python'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCodeByKey((p) => ({ ...p, [codeKey]: problem.starterCode[lang] }))
                  }
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleRunCustom}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Run Custom Stdin
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleRunAllTests}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRunning ? 'Executing...' : 'Run All 7 Tests'}
                </button>
              </div>
            </div>

            <Editor
              height="380px"
              language={lang === 'cpp' ? 'cpp' : lang}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={currentCode}
              onChange={(v) => setCodeByKey((p) => ({ ...p, [codeKey]: v ?? '' }))}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Stdin (defaults to Sample 1 if empty)
                </label>
                <textarea
                  rows={2}
                  value={customStdin}
                  onChange={(e) => setCustomStdin(e.target.value)}
                  placeholder={problem.testCases[0]?.input}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {customOutput !== null && (
                <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono whitespace-pre-wrap">
                  {customOutput}
                </pre>
              )}

              {runnerNote && (
                <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{runnerNote}</span>
                </div>
              )}

              {caseResults && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    Test Suite Results:{' '}
                    {caseResults.filter((r) => r.passed).length} / {problem.testCases.length} passed
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {caseResults.map((r) => (
                      <div
                        key={r.index}
                        className={`p-2.5 rounded-lg border text-xs ${
                          r.passed
                            ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                            : 'border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/50 text-red-900 dark:text-red-200'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>
                            Case #{r.index} ({r.isSample ? 'Sample' : 'Hidden'})
                          </span>
                          <span>{r.passed ? 'PASS' : 'FAIL'}</span>
                        </div>
                        {!r.passed && (
                          <div className="mt-1 font-mono text-[11px] space-y-0.5">
                            {r.error ? (
                              <p className="truncate">Err: {r.error}</p>
                            ) : (
                              <>
                                <p className="truncate">Exp: {r.expected}</p>
                                <p className="truncate">Got: {r.actual}</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reference Solutions Drawer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Verified Reference Solutions
              </span>
              <div className="flex items-center gap-2">
                {(['java', 'python'] as const).map((sl) => (
                  <button
                    key={sl}
                    type="button"
                    onClick={() => setSolutionLang((cur) => (cur === sl ? null : sl))}
                    className={`px-3 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                      solutionLang === sl
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {solutionLang === sl ? `Hide ${sl}` : `Show ${sl === 'java' ? 'Java' : 'Python'}`}
                  </button>
                ))}
              </div>
            </div>

            {solutionLang && (
              <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                <code>{problem.solutions[solutionLang]}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
