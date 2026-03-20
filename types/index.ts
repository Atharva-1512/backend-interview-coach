import type { Difficulty } from "../lib/interviewData";

export type ChatRole = "interviewer" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
};

export type EvaluationResult = {
  score: number; // 1–10
  matchedKeywords: string[];
  missingKeywords: string[];
  feedbackHints: string[];
  improvedAnswer: string;
  matchPercentage: number; // 0–100
};

export type InterviewState = {
  started: boolean;
  currentIndex: number;
  thinking: boolean;
  totalScore: number;
  scores: number[];
  lastEvaluation: EvaluationResult | null;
  difficulty: Difficulty | "all";
};

export type SessionRecord = {
  id: string;
  date: number;          // Date.now()
  difficulty: Difficulty | "all";
  totalQuestions: number;
  answered: number;
  totalScore: number;
  averageScore: number;
  scores: number[];       // per-question scores
};