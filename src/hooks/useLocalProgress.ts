import { useState, useEffect, useCallback, useMemo } from 'react';
import type { McqQuestion, ProgressState, TestAttemptRecord } from '../types/prep';
import {
  APTITUDE_SETS,
  TECHNICAL_SETS,
  CODING_SETS,
  SQL_SETS,
  FULL_MOCKS,
  VERSANT_DRILLS,
  TECHNICAL_INTERVIEW_QA,
  HR_INTERVIEW_QA,
} from '../data';

const STORAGE_KEY = 'hcl_get_prep_v1';

export interface StudyDayItem {
  day: number;
  title: string;
  focus: string;
  targets: string;
}

export const STUDY_PLAN_14_DAYS: StudyDayItem[] = [
  { day: 1, title: 'Ascend Baseline & Java Core', focus: 'Aptitude Set 1 + Java OOP', targets: 'Complete Cognitive Set 1 (90m) and review Java OOP/String Pool concept notes.' },
  { day: 2, title: 'SQL Joins & Aggregates', focus: 'SQL Lab Set 1–2 + DBMS 1NF-BCNF', targets: 'Solve 10 SQL queries (top-N salaries, above dept avg) and study Normalization diagram.' },
  { day: 3, title: 'Technical MCQ Speed Drill', focus: 'Tech Sets 1–2 + Output Tracing', targets: 'Target >=75% accuracy on static init order, Integer cache, and exception traps.' },
  { day: 4, title: 'DSA Arrays & Strings Lab', focus: 'Coding Sets 1–3 (Java/Python)', targets: 'Implement two-pointer, stack bracket, and frequency-map problems cleanly.' },
  { day: 5, title: 'OS Scheduling & Deadlocks', focus: 'Tech Set 3 + OS Diagrams', targets: 'Solve Turnaround/Waiting numericals and review Coffman deadlock conditions.' },
  { day: 6, title: 'Versant Speaking Fluency', focus: 'Versant Drills 1–12 + Reading Aloud', targets: 'Record Reading Aloud + Repeat Sentence drills targeting 135–150 WPM clarity.' },
  { day: 7, title: 'Full Mock 1 & Weak-Area Audit', focus: 'Full Mock 1 (75 items / 90m)', targets: 'Simulate real test conditions; use Retry Wrong Only on missed MCQs.' },
  { day: 8, title: 'JDBC, Collections & Concurrency', focus: 'Tech Sets 4–5 + HashMap Diagram', targets: 'Master PreparedStatement lifecycle, ConcurrentHashMap, and volatile/atomic.' },
  { day: 9, title: 'Advanced SQL Window Functions', focus: 'SQL Lab Sets 3–6', targets: 'Write DENSE_RANK, LAG/LEAD, NOT EXISTS anti-joins, and running totals.' },
  { day: 10, title: 'DSA Stack, Recursion & Matrix', focus: 'Coding Sets 4–8', targets: 'Complete Roman-to-Int, String Compression, Rotation, and Matrix Multiplication.' },
  { day: 11, title: 'CN Subnetting, TCP & Spring Boot', focus: 'Tech Sets 6–7 + CN/Spring Diagrams', targets: 'Trace CIDR masks, TCP 3-way handshake, and @Transactional / REST semantics.' },
  { day: 12, title: 'Full Mocks 2 & 3 Sprint', focus: 'Full Mocks 2–3', targets: 'Maintain pacing (~50 sec/MCQ, 20 min/coding problem) with zero section burnout.' },
  { day: 13, title: 'Interview Bank (Java + SQL + ML)', focus: '50 Tech Q&A + 20 HR Q&A', targets: 'Rehearse end-to-end Spring Boot + SQL + ML project walkthrough out loud.' },
  { day: 14, title: 'Final Dress Rehearsal', focus: 'Full Mock 4 or 5 + Versant 13–24', targets: 'Run final mock, clear wrong-question pool, and review relocation/shift HR answers.' },
];

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_STATE: ProgressState = {
  theme: 'light',
  streakDays: 0,
  lastActiveDate: null,
  completedSets: [],
  solvedCodingIds: [],
  solvedSqlIds: [],
  completedVersantIds: [],
  masteredInterviewIds: [],
  bookmarkedQuestionIds: [],
  wrongPool: {},
  attempts: [],
  studyPlanCompletedDays: [],
};

function loadInitialState(): ProgressState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      return { ...DEFAULT_STATE, theme: prefersDark ? 'dark' : 'light' };
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      completedSets: Array.isArray(parsed.completedSets) ? parsed.completedSets : [],
      solvedCodingIds: Array.isArray(parsed.solvedCodingIds) ? parsed.solvedCodingIds : [],
      solvedSqlIds: Array.isArray(parsed.solvedSqlIds) ? parsed.solvedSqlIds : [],
      completedVersantIds: Array.isArray(parsed.completedVersantIds) ? parsed.completedVersantIds : [],
      masteredInterviewIds: Array.isArray(parsed.masteredInterviewIds) ? parsed.masteredInterviewIds : [],
      bookmarkedQuestionIds: Array.isArray(parsed.bookmarkedQuestionIds) ? parsed.bookmarkedQuestionIds : [],
      wrongPool: parsed.wrongPool && typeof parsed.wrongPool === 'object' ? parsed.wrongPool : {},
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      studyPlanCompletedDays: Array.isArray(parsed.studyPlanCompletedDays) ? parsed.studyPlanCompletedDays : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function bumpStreak(prev: ProgressState): Pick<ProgressState, 'streakDays' | 'lastActiveDate'> {
  const today = getTodayIso();
  if (prev.lastActiveDate === today) {
    return { streakDays: prev.streakDays, lastActiveDate: today };
  }
  if (prev.lastActiveDate === getYesterdayIso()) {
    return { streakDays: prev.streakDays + 1, lastActiveDate: today };
  }
  return { streakDays: 1, lastActiveDate: today };
}

export function useLocalProgress() {
  const [state, setState] = useState<ProgressState>(loadInitialState);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues safely
    }
  }, [state]);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const recordTestAttempt = useCallback(
    (attempt: TestAttemptRecord, questionsMap: Record<string, McqQuestion>) => {
      setState((prev) => {
        const nextWrongPool = { ...prev.wrongPool };
        for (const qr of attempt.questionResults) {
          if (qr.isCorrect) {
            delete nextWrongPool[qr.questionId];
          } else if (questionsMap[qr.questionId]) {
            nextWrongPool[qr.questionId] = questionsMap[qr.questionId];
          }
        }
        const nextCompleted =
          attempt.mode !== 'retry-wrong' && !prev.completedSets.includes(attempt.setId)
            ? [...prev.completedSets, attempt.setId]
            : prev.completedSets;

        return {
          ...prev,
          ...bumpStreak(prev),
          completedSets: nextCompleted,
          wrongPool: nextWrongPool,
          attempts: [attempt, ...prev.attempts].slice(0, 50),
        };
      });
    },
    []
  );

  const toggleBookmark = useCallback((questionId: string) => {
    setState((prev) => {
      const exists = prev.bookmarkedQuestionIds.includes(questionId);
      return {
        ...prev,
        bookmarkedQuestionIds: exists
          ? prev.bookmarkedQuestionIds.filter((id) => id !== questionId)
          : [...prev.bookmarkedQuestionIds, questionId],
      };
    });
  }, []);

  const markCodingSolved = useCallback((problemId: string, solved = true) => {
    setState((prev) => {
      const exists = prev.solvedCodingIds.includes(problemId);
      const next = solved
        ? exists
          ? prev.solvedCodingIds
          : [...prev.solvedCodingIds, problemId]
        : prev.solvedCodingIds.filter((id) => id !== problemId);
      return {
        ...prev,
        ...(solved ? bumpStreak(prev) : {}),
        solvedCodingIds: next,
      };
    });
  }, []);

  const markSqlSolved = useCallback((queryId: string, solved = true) => {
    setState((prev) => {
      const exists = prev.solvedSqlIds.includes(queryId);
      const next = solved
        ? exists
          ? prev.solvedSqlIds
          : [...prev.solvedSqlIds, queryId]
        : prev.solvedSqlIds.filter((id) => id !== queryId);
      return {
        ...prev,
        ...(solved ? bumpStreak(prev) : {}),
        solvedSqlIds: next,
      };
    });
  }, []);

  const toggleVersantComplete = useCallback((drillId: string) => {
    setState((prev) => {
      const exists = prev.completedVersantIds.includes(drillId);
      return {
        ...prev,
        ...(!exists ? bumpStreak(prev) : {}),
        completedVersantIds: exists
          ? prev.completedVersantIds.filter((id) => id !== drillId)
          : [...prev.completedVersantIds, drillId],
      };
    });
  }, []);

  const toggleInterviewMastered = useCallback((qaId: string) => {
    setState((prev) => {
      const exists = prev.masteredInterviewIds.includes(qaId);
      return {
        ...prev,
        ...(!exists ? bumpStreak(prev) : {}),
        masteredInterviewIds: exists
          ? prev.masteredInterviewIds.filter((id) => id !== qaId)
          : [...prev.masteredInterviewIds, qaId],
      };
    });
  }, []);

  const toggleStudyDay = useCallback((day: number) => {
    setState((prev) => {
      const exists = prev.studyPlanCompletedDays.includes(day);
      return {
        ...prev,
        ...(!exists ? bumpStreak(prev) : {}),
        studyPlanCompletedDays: exists
          ? prev.studyPlanCompletedDays.filter((d) => d !== day)
          : [...prev.studyPlanCompletedDays, day].sort((a, b) => a - b),
      };
    });
  }, []);

  const clearWrongPool = useCallback(() => {
    setState((prev) => ({ ...prev, wrongPool: {} }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({ ...DEFAULT_STATE, theme: prev.theme }));
  }, []);

  const stats = useMemo(() => {
    const totalSetsCount = APTITUDE_SETS.length + TECHNICAL_SETS.length + FULL_MOCKS.length;
    const totalCodingCount = CODING_SETS.length * 2;
    const totalSqlCount = SQL_SETS.reduce((acc, s) => acc + s.queries.length, 0);
    const totalVersantCount = VERSANT_DRILLS.length;
    const totalInterviewCount = TECHNICAL_INTERVIEW_QA.length + HR_INTERVIEW_QA.length;

    const avgAccuracy =
      state.attempts.length > 0
        ? state.attempts.reduce((acc, a) => acc + (a.totalQuestions ? a.correctCount / a.totalQuestions : 0), 0) /
          state.attempts.length
        : 0;

    // Weighted HCL GET readiness index out of 100
    const setsRatio = Math.min(1, state.completedSets.length / Math.max(1, totalSetsCount * 0.5));
    const codingRatio = Math.min(1, state.solvedCodingIds.length / Math.max(1, totalCodingCount * 0.5));
    const sqlRatio = Math.min(1, state.solvedSqlIds.length / Math.max(1, totalSqlCount * 0.5));
    const interviewRatio = Math.min(1, state.masteredInterviewIds.length / Math.max(1, totalInterviewCount * 0.35));
    const versantRatio = Math.min(1, state.completedVersantIds.length / Math.max(1, totalVersantCount * 0.5));

    const readinessScore = Math.round(
      (avgAccuracy * 0.35 + setsRatio * 0.25 + codingRatio * 0.18 + sqlRatio * 0.1 + interviewRatio * 0.07 + versantRatio * 0.05) *
        100
    );

    return {
      totalSetsCount,
      totalCodingCount,
      totalSqlCount,
      totalVersantCount,
      totalInterviewCount,
      avgAccuracyPct: Math.round(avgAccuracy * 100),
      readinessScore,
      wrongPoolList: Object.values(state.wrongPool),
    };
  }, [state]);

  return {
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
  };
}
