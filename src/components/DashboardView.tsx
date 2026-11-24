import {
  CheckSquare,
  Square,
  ArrowRight,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { ProgressState } from '../types/prep';
import { STUDY_PLAN_14_DAYS } from '../hooks/useLocalProgress';
import { APTITUDE_SETS, TECHNICAL_SETS, FULL_MOCKS } from '../data';
import type { PrimaryView } from './Header';

interface DashboardViewProps {
  progress: ProgressState;
  stats: {
    totalSetsCount: number;
    totalCodingCount: number;
    totalSqlCount: number;
    totalVersantCount: number;
    totalInterviewCount: number;
    avgAccuracyPct: number;
    readinessScore: number;
    wrongPoolList: Array<{ id: string }>;
  };
  onNavigate: (view: PrimaryView, subTab?: string) => void;
  onStartRetryWrong: () => void;
  onToggleStudyDay: (day: number) => void;
  onResetProgress: () => void;
}

export function DashboardView({
  progress,
  stats,
  onNavigate,
  onStartRetryWrong,
  onToggleStudyDay,
  onResetProgress,
}: DashboardViewProps) {
  const aptDone = APTITUDE_SETS.filter((s) => progress.completedSets.includes(s.setId)).length;
  const techDone = TECHNICAL_SETS.filter((s) => progress.completedSets.includes(s.setId)).length;
  const mocksDone = FULL_MOCKS.filter((m) => progress.completedSets.includes(m.mockId)).length;

  return (
    <div className="space-y-8">
      {/* Hero & Readiness Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              HCLTech Graduate Engineer Trainee · Application Development Track
            </p>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
              Targeted Ascend, Coding, SQL, Versant, and Interview Preparation
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Calibrated for B.Tech CSE candidates specializing in Java, Spring Boot, SQL, and ML fundamentals. Practice 1,069 verified non-duplicate items across timed Ascend sections, live in-browser SQLite queries, Java/Python coding sandboxes, speech drills, and full 75-item mock exams.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('practice', 'mocks')}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2"
            >
              Launch Full Mock <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('labs', 'sql')}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open SQL Lab
            </button>
            {stats.wrongPoolList.length > 0 && (
              <button
                type="button"
                onClick={onStartRetryWrong}
                className="px-4 py-2.5 text-sm font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry {stats.wrongPoolList.length} Wrong Questions
              </button>
            )}
          </div>
        </div>

        {/* Readiness Summary Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Drive Readiness Index
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.readinessScore}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-700 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${stats.readinessScore}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Computed from your recorded MCQ accuracy, sets completed, coding/SQL problems solved, Versant drills, and interview mastery.
            </p>
          </div>

          <dl className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Streak</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {progress.streakDays}d
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Avg Acc.</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.avgAccuracyPct}%
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Bookmarks</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {progress.bookmarkedQuestionIds.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 5-Mode Progress Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('practice', 'cognitive')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode 1 · Ascend Cognitive</p>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Quant, Logic & Verbal
          </p>
          <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
            {aptDone} / {APTITUDE_SETS.length} sets · 240 Qs
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('practice', 'technical')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode 2 · Technical MCQ</p>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Java, DBMS, OS, CN & JDBC
          </p>
          <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
            {techDone} / {TECHNICAL_SETS.length} sets · 200 Qs
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('labs', 'coding')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode 3 · Coding & SQL Lab</p>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            24 Code + 40 SQL Queries
          </p>
          <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
            {progress.solvedCodingIds.length}/{stats.totalCodingCount} code · {progress.solvedSqlIds.length}/{stats.totalSqlCount} SQL
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('interview', 'versant')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode 4 · Versant Speech</p>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            4-Part English Drills
          </p>
          <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
            {progress.completedVersantIds.length} / {stats.totalVersantCount} drills done
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('interview', 'qa')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-5 transition-colors cursor-pointer"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">Mode 5 · Mocks & Q&A</p>
          <p className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            5 Full Mocks + 190 Q&A
          </p>
          <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-400 tabular-nums">
            {mocksDone}/5 mocks · {progress.masteredInterviewIds.length}/{stats.totalInterviewCount} Q&A
          </p>
        </button>
      </section>

      {/* Split Lower Section: 14-Day Study Plan + Recent Attempts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                14-Day HCL GET Sprint Schedule
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {progress.studyPlanCompletedDays.length} of 14 days completed
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[460px] overflow-y-auto pr-1">
            {STUDY_PLAN_14_DAYS.map((item) => {
              const done = progress.studyPlanCompletedDays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => onToggleStudyDay(item.day)}
                  className="w-full text-left py-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 transition-colors cursor-pointer"
                >
                  <span className="mt-0.5 text-blue-700 dark:text-blue-400 shrink-0">
                    {done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                        Day {String(item.day).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span
                        className={`text-sm font-semibold ${
                          done
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.focus}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.targets}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Recent Test Attempts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Stored locally in your browser
                </p>
              </div>
              {progress.attempts.length > 0 && (
                <button
                  type="button"
                  onClick={onResetProgress}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset Data
                </button>
              )}
            </div>

            {progress.attempts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No timed test attempts logged yet
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Start an Ascend Cognitive set, Technical MCQ drill, or 75-item Full Mock to track accuracy and topic weak spots.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('practice', 'cognitive')}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
                >
                  Start First Practice Set
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto">
                {progress.attempts.slice(0, 8).map((att) => {
                  const pct = att.totalQuestions
                    ? Math.round((att.correctCount / att.totalQuestions) * 100)
                    : 0;
                  return (
                    <div key={att.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {att.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                          {att.mode} · {new Date(att.timestamp).toLocaleDateString()} · {Math.round(att.totalTimeSec / 60)}m
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {att.correctCount}/{att.totalQuestions}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {pct}% acc
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pattern note: Official Ascend covers Cognitive, Coding/Technical, and Versant. Sectional durations and zero negative marking reflect student-reported campus drives (toggleable -0.25 penalty in runner).
          </div>
        </div>
      </section>
    </div>
  );
}
