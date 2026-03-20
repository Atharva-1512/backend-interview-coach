import type { EvaluationResult } from "../types";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordHit(normalizedAnswer: string, keyword: string) {
  // Support simple phrase matching; treat hyphens/spaces similarly.
  const k = normalize(keyword).replace(/\s/g, " ");
  if (!k) return false;
  return normalizedAnswer.includes(k);
}

export function evaluateAnswer(
  userAnswer: string,
  keywords: string[],
  idealAnswer: string
): EvaluationResult {
  const normalizedAnswer = normalize(userAnswer);

  const hits: string[] = [];
  const misses: string[] = [];

  for (const k of keywords) {
    if (keywordHit(normalizedAnswer, k)) hits.push(k);
    else misses.push(k);
  }

  const matchPct = keywords.length === 0 ? 0 : hits.length / keywords.length;

  // Score 1–10 with a mild curve so partial answers don't feel brutally low.
  // 0% => 2, ~50% => 6, 100% => 10 (clamped)
  const raw = 2 + Math.round(matchPct * 8);
  const score = Math.max(1, Math.min(10, raw));

  const feedbackHints: string[] = [];
  if (score <= 3) feedbackHints.push("Your answer is currently missing several core concepts.");
  if (score >= 4 && score <= 6) feedbackHints.push("Solid start, but it needs more key details.");
  if (score >= 7 && score <= 8) feedbackHints.push("Good answer—add a bit more precision for an interview.");
  if (score >= 9) feedbackHints.push("Strong, interview-ready answer.");

  return {
    score,
    matchedKeywords: hits,
    missingKeywords: misses,
    feedbackHints,
    improvedAnswer: idealAnswer,
    matchPercentage: Math.round(matchPct * 100),
  };
}