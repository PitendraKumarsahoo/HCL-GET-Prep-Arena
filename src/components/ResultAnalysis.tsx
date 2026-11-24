import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Bookmark, RotateCcw, ArrowLeft, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { McqQuestion, TestAttemptRecord } from '../types/prep';
import { formatSeconds } from '../hooks/useTimer';

interface ResultAnalysisProps {
  attempt: TestAttemptRecord;
  questions: McqQuestion[];
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onRetryWrong: (wrongQuestions: McqQuestion[]) => void;
  onBack: () => void;
}

export function ResultAnalysis({
  attempt,
  questions,
  bookmarkedIds,
  onToggleBookmark,
  onRetryWrong,
  onBack,
}: ResultAnalysisProps) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'unanswered' | 'bookmarked'>('all');

  const questionById = useMemo(() => {
    const map: Record<string, McqQuestion> = {};
    for (const q of questions) map[q.id] = q;
    return map;
  }, [questions]);

  const chartData = useMemo(() => {
    return Object.entries(attempt.topicBreakdown)
      .map(([topic, stat]) => ({
        topic: topic.length > 16 ? topic.slice(0, 15) + '…' : topic,
        fullTopic: topic,
        accuracy: stat.total ? Math.round((stat.correct / stat.total) * 100) : 0,
        correct: stat.correct,
        total: stat.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [attempt.topicBreakdown]);

  const weakTopics = chartData.filter((d) => d.accuracy < 60);

  const accuracyPct = attempt.totalQuestions
    ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100)
    : 0;
  const avgTimePerQ = attempt.totalQuestions
    ? Math.round(attempt.totalTimeSec / attempt.totalQuestions)
    : 0;

  const wrongQuestions = useMemo(
    () => attempt.wrongQuestionIds.map((id) => questionById[id]).filter(Boolean),
    [attempt.wrongQuestionIds, questionById]
  );

  const filteredResults = useMemo(() => {
    return attempt.questionResults.filter((r) => {
      if (filter === 'wrong') return r.selectedIndex !== null && !r.isCorrect;
      if (filter === 'unanswered') return r.selectedIndex === null;
      if (filter === 'bookmarked') return bookmarkedIds.includes(r.questionId);
      return true;
    });
  }, [attempt.questionResults, filter, bookmarkedIds]);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Attempt Analysis · {new Date(attempt.timestamp).toLocaleString()}
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {attempt.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {wrongQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => onRetryWrong(wrongQuestions)}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry {wrongQuestions.length} Wrong
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sets
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Net Score</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {attempt.score} / {attempt.totalQuestions}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {attempt.negativeMarking ? '-0.25 penalty applied' : 'No negative marking'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Overall Accuracy</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {accuracyPct}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            {attempt.correctCount} correct
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Incorrect</p>
          <p className="mt-1 font-display text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
            {attempt.wrongCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Added to Wrong Pool
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Unanswered</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {attempt.unansweredCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Skipped items</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Time / Question</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {avgTimePerQ}s
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Total {formatSeconds(attempt.totalTimeSec)}
          </p>
        </div>
      </div>

      {/* Topic-wise Accuracy Chart & Weak Area Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Topic-Wise Accuracy (%)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.25} />
                <XAxis
                  dataKey="topic"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value, _name, item) => {
                    const p = item?.payload as
                      | { correct: number; total: number; fullTopic: string }
                      | undefined;
                    return [
                      `${value ?? 0}% (${p?.correct ?? 0}/${p?.total ?? 0})`,
                      p?.fullTopic ?? 'Accuracy',
                    ];
                  }}
                />
                <Bar dataKey="accuracy" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Weak Areas (&lt; 60% Accuracy)
          </h2>
          {weakTopics.length === 0 ? (
            <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
              Strong balance across all attempted topics (&ge; 60% everywhere). Focus next on cutting average time per question.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {weakTopics.map((wt) => (
                <li key={wt.fullTopic} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{wt.fullTopic}</span>
                  <span className="text-xs font-mono text-red-600 dark:text-red-400 tabular-nums">
                    {wt.correct}/{wt.total} ({wt.accuracy}%)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filterable Question Review */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Detailed Explanations & Shortcuts
          </h2>
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(
              [
                ['all', `All (${attempt.questionResults.length})`],
                ['wrong', `Wrong (${attempt.wrongCount})`],
                ['unanswered', `Skipped (${attempt.unansweredCount})`],
                ['bookmarked', 'Bookmarked'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  filter === k
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredResults.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No questions match this filter.
            </p>
          ) : (
            filteredResults.map((res, idx) => {
              const q = questionById[res.questionId];
              if (!q) return null;
              const isBookmarked = bookmarkedIds.includes(q.id);
              return (
                <div key={q.id} className="py-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {res.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : res.selectedIndex === null ? (
                        <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Q{idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.subtopic}</span>
                      <span aria-hidden="true">·</span>
                      <span>{res.timeSpentSec}s</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q.id)}
                      className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer ${
                        isBookmarked
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      {isBookmarked ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">
                    {q.question}
                  </p>

                  {q.codeSnippet && (
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                      <code>{q.codeSnippet}</code>
                    </pre>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isCorrectOpt = oIdx === q.correctIndex;
                      const isUserOpt = oIdx === res.selectedIndex;
                      let cls =
                        'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                      if (isCorrectOpt) {
                        cls =
                          'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                      } else if (isUserOpt) {
                        cls =
                          'border-red-400 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                      }
                      return (
                        <div key={oIdx} className={`px-3 py-2 rounded-lg border ${cls}`}>
                          {oIdx + 1}. {opt}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-1.5 leading-relaxed">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Explanation:{' '}
                      </span>
                      {q.explanation}
                    </p>
                    {q.shortcut && (
                      <p className="text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">Shortcut / Trick: </span>
                        {q.shortcut}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
