import { useState, useMemo } from 'react';
import { Search, Bookmark, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { TECHNICAL_INTERVIEW_QA, HR_INTERVIEW_QA } from '../data';
import type { InterviewQA } from '../types/prep';

interface InterviewBankProps {
  masteredIds: string[];
  bookmarkedIds: string[];
  onToggleMastered: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export function InterviewBank({
  masteredIds,
  bookmarkedIds,
  onToggleMastered,
  onToggleBookmark,
}: InterviewBankProps) {
  const [category, setCategory] = useState<'Technical' | 'HR'>('Technical');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [diffFilter, setDiffFilter] = useState<'all' | 'medium' | 'medium-hard' | 'hard'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const dataset: InterviewQA[] =
    category === 'Technical' ? TECHNICAL_INTERVIEW_QA : HR_INTERVIEW_QA;

  const topics = useMemo(() => {
    const set = new Set<string>(dataset.map((q) => q.topic));
    return ['All', ...Array.from(set).sort()];
  }, [dataset]);

  const filtered = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return dataset.filter((item) => {
      if (topicFilter !== 'All' && item.topic !== topicFilter) return false;
      if (diffFilter !== 'all' && item.difficulty !== diffFilter) return false;
      if (onlyBookmarked && !bookmarkedIds.includes(item.id)) return false;
      if (!qLower) return true;
      return (
        item.question.toLowerCase().includes(qLower) ||
        item.answer.toLowerCase().includes(qLower) ||
        item.topic.toLowerCase().includes(qLower) ||
        item.subtopic.toLowerCase().includes(qLower)
      );
    });
  }, [dataset, topicFilter, diffFilter, onlyBookmarked, bookmarkedIds, search]);

  const toggleExpand = (id: string) => {
    setExpandedIds((p) => ({ ...p, [id]: !p[id] }));
  };

  const masteredInCategory = dataset.filter((d) => masteredIds.includes(d.id)).length;

  return (
    <div className="space-y-5">
      {/* Controls & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Interview Preparation Bank (150 Technical + 40 HR)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {masteredInCategory} / {dataset.length} {category} questions marked mastered
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['Technical', 'HR'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setTopicFilter('All');
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                  category === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat === 'Technical' ? 'Technical (150)' : 'HR & Behavioral (40)'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Java, Spring Boot, SQL, deadlock, relocation..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  Topic: {t}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={diffFilter}
              onChange={(e) =>
                setDiffFilter(e.target.value as 'all' | 'medium' | 'medium-hard' | 'hard')
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Difficulty</option>
              <option value="medium">Medium</option>
              <option value="medium-hard">Medium-Hard</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyBookmarked}
                onChange={(e) => setOnlyBookmarked(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-700"
              />
              Saved Only
            </label>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No interview Q&As match your active search or filters.
          </p>
        ) : (
          filtered.map((item) => {
            const expanded = !!expandedIds[item.id];
            const isMastered = masteredIds.includes(item.id);
            const isBookmarked = bookmarkedIds.includes(item.id);

            return (
              <div key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="flex-1 text-left cursor-pointer group"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.topic} · {item.subtopic} ·{' '}
                      <span className="capitalize">{item.difficulty}</span> ·{' '}
                      {item.source_tag === 'reported' ? 'Reported seed' : 'PYQ-style'}
                    </p>
                    <h2 className="mt-1 text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {item.question}
                    </h2>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleMastered(item.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border inline-flex items-center gap-1 cursor-pointer ${
                        isMastered
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isMastered ? 'Mastered' : 'Mark Done'}
                    </button>

                    <button
                      type="button"
                      aria-label="Bookmark Q&A"
                      onClick={() => onToggleBookmark(item.id)}
                      className={`p-1.5 rounded-md border cursor-pointer ${
                        isBookmarked
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      aria-label={expanded ? 'Collapse answer' : 'Expand answer'}
                      onClick={() => toggleExpand(item.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    <p>{item.answer}</p>

                    <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Panel Key Bullet Points
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {item.keyPoints.map((kp, i) => (
                          <li key={i}>{kp}</li>
                        ))}
                      </ul>
                    </div>

                    {item.followUp && (
                      <p className="text-xs text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">Likely Follow-Up: </span>
                        {item.followUp}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
