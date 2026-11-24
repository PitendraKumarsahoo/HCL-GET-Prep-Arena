import { useState, useMemo } from 'react';
import { Sun, Moon, CheckCircle2, Play } from 'lucide-react';
import { Header, type PrimaryView } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TestArena, type ActiveTestConfig } from './components/TestArena';
import { ResultAnalysis } from './components/ResultAnalysis';
import { CodingLab } from './components/CodingLab';
import { SqlLab } from './components/SqlLab';
import { VersantLab } from './components/VersantLab';
import { InterviewBank } from './components/InterviewBank';
import { ConceptsView } from './components/ConceptsView';
import { ResourcesView } from './components/ResourcesView';
import { useLocalProgress } from './hooks/useLocalProgress';
import { APTITUDE_SETS, TECHNICAL_SETS, FULL_MOCKS } from './data';
import type { McqQuestion, TestAttemptRecord } from './types/prep';

export default function App() {
  const {
    state,
    stats,
    toggleTheme,
    recordTestAttempt,
    toggleBookmark,
    markCodingSolved,
    markSqlSolved,
    toggleVersantComplete,
    toggleInterviewMastered,
    toggleStudyDay,
    clearWrongPool,
    resetProgress,
  } = useLocalProgress();

  const [activeView, setActiveView] = useState<PrimaryView>('dashboard');
  const [practiceSubTab, setPracticeSubTab] = useState<'cognitive' | 'technical' | 'mocks'>('cognitive');
  const [labsSubTab, setLabsSubTab] = useState<'coding' | 'sql'>('coding');
  const [interviewSubTab, setInterviewSubTab] = useState<'versant' | 'qa'>('versant');
  const [conceptsSubTab, setConceptsSubTab] = useState<'diagrams' | 'resources'>('diagrams');

  const [activeTest, setActiveTest] = useState<ActiveTestConfig | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{
    attempt: TestAttemptRecord;
    questions: McqQuestion[];
  } | null>(null);

  const navigate = (view: PrimaryView, subTab?: string) => {
    setActiveTest(null);
    setLastAttempt(null);
    setActiveView(view);
    if (view === 'practice' && (subTab === 'cognitive' || subTab === 'technical' || subTab === 'mocks')) {
      setPracticeSubTab(subTab);
    } else if (view === 'labs' && (subTab === 'coding' || subTab === 'sql')) {
      setLabsSubTab(subTab);
    } else if (view === 'interview' && (subTab === 'versant' || subTab === 'qa')) {
      setInterviewSubTab(subTab);
    } else if (view === 'concepts' && (subTab === 'diagrams' || subTab === 'resources')) {
      setConceptsSubTab(subTab);
    }
  };

  const launchAptitudeSet = (setId: string) => {
    const s = APTITUDE_SETS.find((item) => item.setId === setId);
    if (!s) return;
    setLastAttempt(null);
    setActiveTest({
      mode: 'cognitive',
      setId: s.setId,
      title: s.title,
      durationMinutes: s.durationMinutes,
      questions: s.questions,
    });
  };

  const launchTechnicalSet = (setId: string) => {
    const s = TECHNICAL_SETS.find((item) => item.setId === setId);
    if (!s) return;
    setLastAttempt(null);
    setActiveTest({
      mode: 'technical',
      setId: s.setId,
      title: s.title,
      durationMinutes: s.durationMinutes,
      questions: s.questions,
    });
  };

  const launchFullMock = (mockId: string) => {
    const m = FULL_MOCKS.find((item) => item.mockId === mockId);
    if (!m) return;
    const mergedMcqs: McqQuestion[] = [
      ...m.aptitudeQuestions,
      ...m.technicalQuestions.map((q) => ({ ...q, section: undefined })),
    ];
    setLastAttempt(null);
    setActiveTest({
      mode: 'full-mock',
      setId: m.mockId,
      title: m.title,
      durationMinutes: m.durationMinutes,
      questions: mergedMcqs,
      codingProblems: m.codingProblems,
    });
  };

  const launchRetryWrong = (questionsList: McqQuestion[]) => {
    if (questionsList.length === 0) return;
    setLastAttempt(null);
    setActiveView('practice');
    setActiveTest({
      mode: 'retry-wrong',
      setId: `retry-${Date.now()}`,
      title: `Retry Wrong Questions (${questionsList.length})`,
      durationMinutes: Math.max(10, Math.ceil(questionsList.length * 1.5)),
      questions: questionsList,
    });
  };

  const quickStartNextMock = () => {
    const nextUnfinished =
      FULL_MOCKS.find((m) => !state.completedSets.includes(m.mockId)) ?? FULL_MOCKS[0];
    setActiveView('practice');
    setPracticeSubTab('mocks');
    launchFullMock(nextUnfinished.mockId);
  };

  const handleTestComplete = (
    attempt: TestAttemptRecord,
    questionsMap: Record<string, McqQuestion>
  ) => {
    recordTestAttempt(attempt, questionsMap);
    const orderedQs = attempt.questionResults
      .map((r) => questionsMap[r.questionId])
      .filter(Boolean);
    setActiveTest(null);
    setLastAttempt({ attempt, questions: orderedQs });
  };

  const wrongPoolQuestions = useMemo(() => Object.values(state.wrongPool), [state.wrongPool]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        activeView={activeView}
        onNavigate={(v) => navigate(v)}
        onQuickStartMock={quickStartNextMock}
      />

      {/* Workspace Sub-Navigation & Theme Toolbar (cleanly below Top Bar) */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60">
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {activeView === 'dashboard' && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Overview · Progress saved locally in browser
              </span>
            )}

            {activeView === 'practice' && !activeTest && !lastAttempt && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    ['cognitive', 'Mode 1 · Cognitive (8 Sets)'],
                    ['technical', 'Mode 2 · Technical MCQ (8 Sets)'],
                    ['mocks', 'Mode 5 · Full Mocks (5)'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPracticeSubTab(k)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      practiceSubTab === k
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {activeView === 'labs' && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    ['coding', 'Coding Lab (12 Sets · 24 Problems)'],
                    ['sql', 'SQL Lab (8 Sets · 40 Queries)'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLabsSubTab(k)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      labsSubTab === k
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {activeView === 'interview' && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    ['versant', 'Mode 4 · Versant Speech Lab (24 Drills)'],
                    ['qa', 'Interview Bank (150 Tech + 40 HR)'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setInterviewSubTab(k)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      interviewSubTab === k
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}

            {activeView === 'concepts' && (
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    ['diagrams', 'CS & Spring Mermaid Diagrams (10)'],
                    ['resources', 'Official & Free Resources (32)'],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setConceptsSubTab(k)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                      conceptsSubTab === k
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
          >
            {state.theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5" /> Light Mode
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" /> Dark Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-[1380px] px-4 sm:px-6 py-6 sm:py-8">
        {activeTest ? (
          <TestArena
            config={activeTest}
            theme={state.theme}
            bookmarkedIds={state.bookmarkedQuestionIds}
            onToggleBookmark={toggleBookmark}
            onComplete={handleTestComplete}
            onExit={() => setActiveTest(null)}
          />
        ) : lastAttempt ? (
          <ResultAnalysis
            attempt={lastAttempt.attempt}
            questions={lastAttempt.questions}
            bookmarkedIds={state.bookmarkedQuestionIds}
            onToggleBookmark={toggleBookmark}
            onRetryWrong={(qs) => launchRetryWrong(qs)}
            onBack={() => setLastAttempt(null)}
          />
        ) : (
          <>
            {activeView === 'dashboard' && (
              <DashboardView
                progress={state}
                stats={stats}
                onNavigate={navigate}
                onStartRetryWrong={() => launchRetryWrong(wrongPoolQuestions)}
                onToggleStudyDay={toggleStudyDay}
                onResetProgress={resetProgress}
              />
            )}

            {activeView === 'practice' && (
              <div className="space-y-6">
                {wrongPoolQuestions.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                      <span className="font-semibold tabular-nums">
                        {wrongPoolQuestions.length} incorrect questions
                      </span>{' '}
                      queued in your Weak-Area Pool for targeted re-testing.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => launchRetryWrong(wrongPoolQuestions)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                      >
                        Retry Wrong Pool
                      </button>
                      <button
                        type="button"
                        onClick={clearWrongPool}
                        className="px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {practiceSubTab === 'cognitive' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {APTITUDE_SETS.map((s) => {
                      const done = state.completedSets.includes(s.setId);
                      const last = state.attempts.find((a) => a.setId === s.setId);
                      return (
                        <div
                          key={s.setId}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{s.questions.length} Qs · {s.durationMinutes} min</span>
                              {done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <h2 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                              {s.title}
                            </h2>
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {s.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {last ? `Last: ${last.correctCount}/${last.totalQuestions}` : 'Not attempted'}
                            </span>
                            <button
                              type="button"
                              onClick={() => launchAptitudeSet(s.setId)}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3 h-3" /> {done ? 'Retake' : 'Start'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {practiceSubTab === 'technical' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {TECHNICAL_SETS.map((s) => {
                      const done = state.completedSets.includes(s.setId);
                      const last = state.attempts.find((a) => a.setId === s.setId);
                      return (
                        <div
                          key={s.setId}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{s.questions.length} Qs · {s.durationMinutes} min</span>
                              {done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <h2 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                              {s.title}
                            </h2>
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {s.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {last ? `Last: ${last.correctCount}/${last.totalQuestions}` : 'Not attempted'}
                            </span>
                            <button
                              type="button"
                              onClick={() => launchTechnicalSet(s.setId)}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3 h-3" /> {done ? 'Retake' : 'Start'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {practiceSubTab === 'mocks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FULL_MOCKS.map((m) => {
                      const done = state.completedSets.includes(m.mockId);
                      const last = state.attempts.find((a) => a.setId === m.mockId);
                      const totalItems =
                        m.aptitudeQuestions.length +
                        m.technicalQuestions.length +
                        m.codingProblems.length;
                      return (
                        <div
                          key={m.mockId}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              <span>
                                {totalItems} items (37 Apt + 36 Tech + 2 Code) · {m.durationMinutes}m
                              </span>
                              {done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <h2 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {m.title}
                            </h2>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {m.description}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                              {last
                                ? `Last MCQ: ${last.correctCount}/${last.totalQuestions}`
                                : '100% unseen items'}
                            </span>
                            <button
                              type="button"
                              onClick={() => launchFullMock(m.mockId)}
                              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" /> {done ? 'Retake Mock' : 'Start Full Mock'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeView === 'labs' &&
              (labsSubTab === 'coding' ? (
                <CodingLab
                  theme={state.theme}
                  solvedIds={state.solvedCodingIds}
                  onMarkSolved={markCodingSolved}
                />
              ) : (
                <SqlLab
                  theme={state.theme}
                  solvedIds={state.solvedSqlIds}
                  onMarkSolved={markSqlSolved}
                />
              ))}

            {activeView === 'interview' &&
              (interviewSubTab === 'versant' ? (
                <VersantLab
                  completedIds={state.completedVersantIds}
                  onToggleComplete={toggleVersantComplete}
                />
              ) : (
                <InterviewBank
                  masteredIds={state.masteredInterviewIds}
                  bookmarkedIds={state.bookmarkedQuestionIds}
                  onToggleMastered={toggleInterviewMastered}
                  onToggleBookmark={toggleBookmark}
                />
              ))}

            {activeView === 'concepts' &&
              (conceptsSubTab === 'diagrams' ? (
                <ConceptsView theme={state.theme} />
              ) : (
                <ResourcesView />
              ))}
          </>
        )}
      </main>
    </div>
  );
}
