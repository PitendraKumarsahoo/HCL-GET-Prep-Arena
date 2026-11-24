import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import initSqlJs, { type Database } from 'sql.js';
import { CheckCircle2, Play, RotateCcw, Eye } from 'lucide-react';
import { SQL_SETS } from '../data';
import type { SqlProblem } from '../types/prep';

interface SqlLabProps {
  theme: 'light' | 'dark';
  solvedIds: string[];
  onMarkSolved: (queryId: string, solved?: boolean) => void;
}

function normalizeCell(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return String(val);
    return Number(val.toFixed(2)).toString();
  }
  const str = String(val).trim();
  const num = Number(str);
  if (str !== '' && !Number.isNaN(num) && str.includes('.')) {
    return Number(num.toFixed(2)).toString();
  }
  return str;
}

export function SqlLab({ theme, solvedIds, onMarkSolved }: SqlLabProps) {
  const [setIdx, setSetIdx] = useState(0);
  const [queryIdx, setQueryIdx] = useState(0);
  const [sqlByKey, setSqlByKey] = useState<Record<string, string>>({});
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [resultCols, setResultCols] = useState<string[]>([]);
  const [resultRows, setResultRows] = useState<Array<Array<unknown>>>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ pass: boolean; message: string } | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const sqlJsRef = useRef<Awaited<ReturnType<typeof initSqlJs>> | null>(null);
  const dbRef = useRef<Database | null>(null);

  const activeSet = SQL_SETS[setIdx];
  const problem: SqlProblem = activeSet.queries[queryIdx];
  const editorVal = sqlByKey[problem.id] ?? '-- Write your SQL query below\nSELECT ';

  const loadProblemDb = (prob: SqlProblem) => {
    if (!sqlJsRef.current) return;
    try {
      dbRef.current?.close();
      const db = new sqlJsRef.current.Database();
      db.run(`${prob.schemaSql}\n${prob.seedSql}`);
      dbRef.current = db;
      setDbError(null);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : 'Failed initializing SQLite schema');
    }
  };

  useEffect(() => {
    let mounted = true;
    initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
      .then((SQL) => {
        if (!mounted) return;
        sqlJsRef.current = SQL;
        setDbReady(true);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setDbError(err instanceof Error ? err.message : 'Failed loading sql-wasm.wasm');
      });
    return () => {
      mounted = false;
      dbRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    loadProblemDb(problem);
    setResultCols([]);
    setResultRows([]);
    setQueryError(null);
    setVerdict(null);
    setShowSolution(false);
  }, [dbReady, problem]);

  const handleRunSql = () => {
    if (!dbRef.current) return;
    setQueryError(null);
    setVerdict(null);
    try {
      // Fresh DB on every check so DML practice stays clean & deterministic
      loadProblemDb(problem);
      const res = dbRef.current!.exec(editorVal);
      if (res.length === 0) {
        setResultCols([]);
        setResultRows([]);
        setVerdict({ pass: false, message: 'Query returned 0 result sets.' });
        return;
      }
      const last = res[res.length - 1];
      setResultCols(last.columns);
      setResultRows(last.values);

      // Compare columns & rows against expected output
      const expCols = problem.expectedColumns.map((c: string) => c.toLowerCase());
      const gotCols = last.columns.map((c: string) => c.toLowerCase());
      const colsMatch =
        expCols.length === gotCols.length && expCols.every((c, i) => c === gotCols[i]);

      const expRows = problem.expectedRows.map((r) => r.map(normalizeCell));
      const gotRows = last.values.map((r) => r.map(normalizeCell));
      const rowsMatch =
        expRows.length === gotRows.length &&
        expRows.every(
          (row, rIdx) =>
            row.length === gotRows[rIdx]?.length &&
            row.every((cell, cIdx) => cell === gotRows[rIdx][cIdx])
        );

      if (colsMatch && rowsMatch) {
        setVerdict({
          pass: true,
          message: `Matched all ${expRows.length} expected rows and column names exactly.`,
        });
        onMarkSolved(problem.id, true);
      } else {
        setVerdict({
          pass: false,
          message: !colsMatch
            ? `Column mismatch. Expected [${problem.expectedColumns.join(', ')}], got [${last.columns.join(', ')}].`
            : `Row mismatch. Expected ${expRows.length} rows, got ${gotRows.length} rows (check sorting, NULL handling, or aliases).`,
        });
      }
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'SQL execution error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            SQL Lab Set:
            <select
              value={setIdx}
              onChange={(e) => {
                setSetIdx(Number(e.target.value));
                setQueryIdx(0);
              }}
              className="ml-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {SQL_SETS.map((s, idx) => (
                <option key={s.setId} value={idx}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {activeSet.queries.map((q, qI) => {
              const solved = solvedIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQueryIdx(qI)}
                  className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer inline-flex items-center gap-1 whitespace-nowrap ${
                    queryIdx === qI
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {solved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  Q{qI + 1}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          In-Browser SQLite3 Engine · {solvedIds.length} / 40 solved
        </span>
      </div>

      {dbError && (
        <div className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 text-sm text-red-800 dark:text-red-200">
          {dbError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Prompt, Schema & Expected Output */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {problem.subtopic} · <span className="capitalize">{problem.difficulty}</span> ·{' '}
              {problem.source_tag === 'reported' ? 'Reported pattern' : 'PYQ-style'}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              {problem.title}
            </h2>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {problem.prompt}
          </p>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Table Schema & Seed Data
            </h3>
            <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
              <code>{`${problem.schemaSql}\n${problem.seedSql}`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
              Expected Result ({problem.expectedRows.length} rows)
            </h3>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="min-w-full text-xs text-left tabular-nums">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <tr>
                    {problem.expectedColumns.map((col) => (
                      <th key={col} className="px-3 py-2 font-mono font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {problem.expectedRows.slice(0, 6).map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">
                          {cell === null ? 'NULL' : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: SQL Editor & Query Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                SQL Editor (SQLite / ANSI SQL)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadProblemDb(problem);
                    setResultCols([]);
                    setResultRows([]);
                    setVerdict(null);
                    setQueryError(null);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset DB
                </button>
                <button
                  type="button"
                  onClick={() => setShowSolution((s) => !s)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> {showSolution ? 'Hide Solution' : 'Solution'}
                </button>
                <button
                  type="button"
                  disabled={!dbReady}
                  onClick={handleRunSql}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Run & Verify
                </button>
              </div>
            </div>

            <Editor
              height="240px"
              language="sql"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={editorVal}
              onChange={(v) => setSqlByKey((p) => ({ ...p, [problem.id]: v ?? '' }))}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {queryError && (
            <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 text-xs font-mono text-red-800 dark:text-red-200">
              {queryError}
            </div>
          )}

          {verdict && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                verdict.pass
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200'
                  : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200'
              }`}
            >
              {verdict.pass ? 'PASS — ' : 'CHECK — '}
              {verdict.message}
            </div>
          )}

          {resultCols.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                Your Output ({resultRows.length} rows)
              </p>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full text-xs text-left tabular-nums">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      {resultCols.map((c) => (
                        <th key={c} className="px-3 py-2 font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {resultRows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 font-mono text-slate-800 dark:text-slate-200">
                            {val === null ? 'NULL' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showSolution && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Reference SQL Solution
                </p>
                <button
                  type="button"
                  onClick={() => setSqlByKey((p) => ({ ...p, [problem.id]: problem.solutionSql }))}
                  className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Load into Editor
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                <code>{problem.solutionSql}</code>
              </pre>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {problem.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
