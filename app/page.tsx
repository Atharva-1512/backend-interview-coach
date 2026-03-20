"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import { interviewQuestions } from "../lib/interviewData";
import { evaluateAnswer } from "../lib/evaluator";
import type { ChatMessage, InterviewState, EvaluationResult } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const interviewerGreetings = [
  "Welcome! I’ll ask one question at a time—answer as if this were a real backend interview.",
  "Alright—let’s run a backend interview simulation. One question at a time, with feedback after each answer.",
  "Let’s practice backend interview questions offline. I’ll score your answers and suggest improvements.",
];

const startPrompts = [
  "Ready when you are. Here’s your first question:",
  "Let’s begin. First question:",
  "Great—starting now. Question one:",
];

export default function Page() {
  const total = interviewQuestions.length;

  const initialState: InterviewState = useMemo(
    () => ({
      started: false,
      currentIndex: 0,
      thinking: false,
      totalScore: 0,
      scores: [],
      lastEvaluation: null,
    }),
    []
  );

  const [state, setState] = useState<InterviewState>(initialState);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "interviewer",
      content: randomFrom(interviewerGreetings),
      timestamp: Date.now(),
    },
  ]);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state.thinking]);

  function resetInterview() {
    setState({
      started: false,
      currentIndex: 0,
      thinking: false,
      totalScore: 0,
      scores: [],
      lastEvaluation: null,
    });
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "interviewer",
        content: randomFrom(interviewerGreetings),
        timestamp: Date.now(),
      },
    ]);
  }

  function pushInterviewerMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "interviewer",
        content,
        timestamp: Date.now(),
      },
    ]);
  }

  function pushUserMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      },
    ]);
  }

  function startInterview() {
    if (state.started) return;

    setState((s) => ({ ...s, started: true, currentIndex: 0, lastEvaluation: null }));

    const q = interviewQuestions[0];
    // Slight “AI-like” pacing
    setState((s) => ({ ...s, thinking: true }));
    setTimeout(() => {
      pushInterviewerMessage(`${randomFrom(startPrompts)}\n\n${q.question}`);
      setState((s) => ({ ...s, thinking: false }));
    }, 900);
  }

  function getProgressLabel() {
    const idx = clamp(state.currentIndex + 1, 1, total);
    return `Question ${idx}/${total}`;
  }

  function averageScore() {
    if (state.scores.length === 0) return 0;
    return Math.round((state.totalScore / state.scores.length) * 10) / 10;
  }

  function buildFeedbackText(result: EvaluationResult) {
    const openers = [
      "Thanks—here’s my feedback.",
      "Got it. Here’s how I’d evaluate that.",
      "Alright. Quick assessment:",
      "Okay—let’s break this down.",
    ];

    const strengthLines =
      result.matchedKeywords.length > 0
        ? [
            `You covered: ${result.matchedKeywords.join(", ")}.`,
            `Good mentions: ${result.matchedKeywords.join(", ")}.`,
          ]
        : ["I didn’t see key concepts explicitly called out."];

    const missingLines =
      result.missingKeywords.length > 0
        ? [
            `You missed important concepts like: ${result.missingKeywords.join(", ")}.`,
            `To strengthen the answer, add: ${result.missingKeywords.join(", ")}.`,
          ]
        : ["Nice—this hits the main concepts I expected."];

    const scoreLines = [
      `Score: ${result.score}/10.`,
      `I’d rate this ${result.score}/10.`,
      `This is about a ${result.score}/10 answer.`,
    ];

    const nextSteps = [
      "Try to be more explicit and structured (definition → properties → example).",
      "Add a short example or trade-off; that’s what interviewers look for.",
      "Aim for a crisp definition first, then 2–3 key properties, then a practical example.",
    ];

    const parts = [
      randomFrom(openers),
      randomFrom(scoreLines),
      randomFrom(strengthLines),
      randomFrom(missingLines),
      randomFrom(nextSteps),
    ];

    return parts.join("\n");
  }

  function askNextQuestion(nextIndex: number) {
    if (nextIndex >= total) {
      // End screen message
      const finalAvg = averageScore();
      const wrapUps = [
        "That’s the end of the interview simulation.",
        "We’ve finished all questions.",
        "Interview complete—nice work sticking through it.",
      ];
      pushInterviewerMessage(
        `${randomFrom(wrapUps)}\n\nFinal stats:\n- Questions answered: ${state.scores.length}/${total}\n- Total score: ${state.totalScore}\n- Average score: ${finalAvg}/10\n\nYou can restart anytime to practice again.`
      );
      return;
    }

    const q = interviewQuestions[nextIndex];
    const transitions = [
      "Let’s move on.",
      "Next one.",
      "Alright—next question.",
      "Good. Here’s the next question.",
    ];

    setState((s) => ({ ...s, thinking: true }));
    setTimeout(() => {
      pushInterviewerMessage(`${randomFrom(transitions)}\n\n${q.question}`);
      setState((s) => ({ ...s, thinking: false, currentIndex: nextIndex, lastEvaluation: null }));
    }, 1100 + Math.floor(Math.random() * 700));
  }

  async function handleSubmitAnswer(answer: string) {
    if (!state.started) return;
    if (state.thinking) return;
    if (state.currentIndex >= total) return;

    const trimmed = answer.trim();
    if (!trimmed) {
      pushInterviewerMessage("Please type an answer (a couple of sentences is enough).");
      return;
    }

    const q = interviewQuestions[state.currentIndex];

    pushUserMessage(trimmed);
    setState((s) => ({ ...s, thinking: true }));

    // Evaluate locally (no APIs).
    const result = evaluateAnswer(trimmed, q.keywords, q.idealAnswer);

    // Fake “AI thinking” delay
    const delay = 1000 + Math.floor(Math.random() * 900);

    setTimeout(() => {
      const feedback = buildFeedbackText(result);

      pushInterviewerMessage(
        `${feedback}\n\nImproved answer (example):\n${result.improvedAnswer}`
      );

      setState((s) => {
        const scores = [...s.scores, result.score];
        const totalScore = s.totalScore + result.score;
        return {
          ...s,
          thinking: false,
          scores,
          totalScore,
          lastEvaluation: result,
        };
      });

      // Auto-advance shortly after feedback
      setTimeout(() => {
        const next = state.currentIndex + 1;
        askNextQuestion(next);
      }, 900);
    }, delay);
  }

  function handleImproveMyAnswer() {
    if (!state.started) return;
    if (state.thinking) return;
    if (state.currentIndex >= total) return;

    const q = interviewQuestions[state.currentIndex];

    const templates = [
      "Sure—here’s a stronger, more interview-ready version you can use:",
      "Absolutely. Here’s a polished version (tight definition + key points):",
      "Here’s an improved answer that would score higher in an interview:",
    ];

    setState((s) => ({ ...s, thinking: true }));
    setTimeout(() => {
      pushInterviewerMessage(`${randomFrom(templates)}\n\n${q.idealAnswer}`);
      setState((s) => ({ ...s, thinking: false }));
    }, 900 + Math.floor(Math.random() * 700));
  }

  const canAnswer =
    state.started && !state.thinking && state.currentIndex < total;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {!state.started ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Backend Interview Coach
            </h1>
            <p className="text-slate-300">
              Practice backend interviews without AI APIs
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={startInterview}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              >
                Start Interview
              </button>
              <button
                onClick={resetInterview}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Questions" value={`${total}`} />
              <StatCard label="Offline evaluation" value="Local logic" />
              <StatCard label="Deploy" value="Vercel-ready" />
            </div>
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-slate-300">{getProgressLabel()}</div>
              <div className="text-lg font-semibold">Backend Interview Coach (Offline)</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <span className="text-slate-300">Avg: </span>
                <span className="font-semibold">{averageScore()}/10</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <span className="text-slate-300">Total: </span>
                <span className="font-semibold">{state.totalScore}</span>
              </div>

              <button
                onClick={handleImproveMyAnswer}
                disabled={!state.started || state.thinking || state.currentIndex >= total}
                className="rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-50"
              >
                Improve my answer
              </button>

              <button
                onClick={resetInterview}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Restart
              </button>
            </div>
          </header>

          <ChatWindow
            messages={messages}
            thinking={state.thinking}
            onSubmit={handleSubmitAnswer}
            canAnswer={canAnswer}
            scrollAnchorRef={scrollAnchorRef}
          />
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}