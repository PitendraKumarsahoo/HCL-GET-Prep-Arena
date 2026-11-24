export type Difficulty = 'medium' | 'medium-hard' | 'hard';
export type SourceTag = 'reported' | 'pyq-style';
export type AptitudeSection = 'quant' | 'reasoning' | 'verbal';
export type TechnicalTopic =
  | 'Java'
  | 'OOP'
  | 'DBMS'
  | 'SQL'
  | 'OS'
  | 'CN'
  | 'DSA'
  | 'SE'
  | 'JDBC'
  | 'Output Prediction';

export interface McqQuestion {
  id: string;
  section?: AptitudeSection;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  source_tag: SourceTag;
  question: string;
  passage?: string;
  codeSnippet?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  shortcut?: string;
}

export interface AptitudeSet {
  setId: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: McqQuestion[];
}

export interface TechnicalMcqSet {
  setId: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: McqQuestion[];
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  note?: string;
}

export interface CodingProblem {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  source_tag: SourceTag;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  testCases: CodingTestCase[]; // 2 sample + 5 hidden
  starterCode: {
    java: string;
    python: string;
    cpp: string;
  };
  solutions: {
    java: string;
    python: string;
  };
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
}

export interface CodingSet {
  setId: string;
  title: string;
  description: string;
  durationMinutes: number;
  problems: [CodingProblem, CodingProblem];
}

export interface SqlProblem {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  source_tag: SourceTag;
  title: string;
  prompt: string;
  schemaSql: string;
  seedSql: string;
  expectedColumns: string[];
  expectedRows: Array<Array<string | number | null>>;
  solutionSql: string;
  explanation: string;
}

export interface SqlSet {
  setId: string;
  title: string;
  description: string;
  durationMinutes: number;
  queries: SqlProblem[];
}

export interface FullMockSet {
  mockId: string;
  title: string;
  description: string;
  durationMinutes: number;
  aptitudeQuestions: McqQuestion[];
  technicalQuestions: McqQuestion[];
  codingProblems: [CodingProblem, CodingProblem];
}

export interface InterviewQA {
  id: string;
  category: 'Technical' | 'HR';
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  source_tag: SourceTag;
  question: string;
  answer: string;
  keyPoints: string[];
  followUp?: string;
}

export interface VersantDrill {
  id: string;
  part: 'Reading Aloud' | 'Repeat Sentence' | 'Sentence Builds' | 'Short Answer';
  prompt: string;
  phrases?: string[];
  modelAnswer?: string;
  rubricChecklist: string[];
}

export interface ConceptDiagram {
  id: string;
  subject: 'OS' | 'DBMS' | 'CN' | 'Java' | 'Spring Boot & REST';
  title: string;
  analogy: string;
  summary: string;
  keyTakeaways: string[];
  mermaidCode: string;
  examTrap: string;
}

export interface ResourceLink {
  id: string;
  category:
    | 'Official HCLTech'
    | 'Candidate Experiences'
    | 'PYQs & Mocks'
    | 'Coding Platforms'
    | 'Aptitude Prep'
    | 'SQL Mastery'
    | 'Java & OOP'
    | 'OS, DBMS & CN'
    | 'Spoken English (Versant)';
  title: string;
  url: string;
  description: string;
  tag: string;
}

export interface TestAttemptRecord {
  id: string;
  mode: 'cognitive' | 'technical' | 'full-mock' | 'retry-wrong';
  setId: string;
  title: string;
  timestamp: number;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  negativeMarking: boolean;
  totalTimeSec: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  wrongQuestionIds: string[];
  questionResults: Array<{
    questionId: string;
    selectedIndex: number | null;
    correctIndex: number;
    timeSpentSec: number;
    isCorrect: boolean;
  }>;
}

export interface ProgressState {
  theme: 'light' | 'dark';
  streakDays: number;
  lastActiveDate: string | null;
  completedSets: string[];
  solvedCodingIds: string[];
  solvedSqlIds: string[];
  completedVersantIds: string[];
  masteredInterviewIds: string[];
  bookmarkedQuestionIds: string[];
  wrongPool: Record<string, McqQuestion>;
  attempts: TestAttemptRecord[];
  studyPlanCompletedDays: number[];
}
