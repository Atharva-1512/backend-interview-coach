"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ChatWindow from "../components/ChatWindow";
import { interviewQuestions } from "../lib/interviewData";
import type { Difficulty } from "../lib/interviewData";
import { evaluateAnswer } from "../lib/evaluator";
import type { ChatMessage, InterviewState, EvaluationResult, SessionRecord } from "../types";

/* ─── Helpers ───────────────────────────────────────────────────────── */
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function randomFrom<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

const interviewerGreetings = [
  "Welcome! I'll ask one question at a time—answer as if this were a real backend interview.",
  "Alright—let's run a backend interview simulation. One question at a time, with feedback after each answer.",
  "Let's practice backend interview questions offline. I'll score your answers and suggest improvements.",
];
const startPrompts = [
  "Ready when you are. Here's your first question:",
  "Let's begin. First question:",
  "Great—starting now. Question one:",
];

/* ─── localStorage helpers ──────────────────────────────────────────── */
const LS_KEY = "interview_coach_sessions";

function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSession(record: SessionRecord) {
  if (typeof window === "undefined") return;
  try {
    const sessions = loadSessions();
    sessions.unshift(record);
    localStorage.setItem(LS_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {}
}

function clearSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY);
}

/* ─── Particle canvas ───────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mouse.current = { x: e.clientX, y: e.clientY }; });

    const SPACING = 38;
    type Dot = { bx: number; by: number; x: number; y: number; vx: number; vy: number };
    let dots: Dot[] = [];
    const buildDots = () => {
      dots = [];
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          dots.push({ bx: c * SPACING, by: r * SPACING, x: c * SPACING, y: r * SPACING, vx: 0, vy: 0 });
    };
    buildDots();
    window.addEventListener("resize", buildDots);

    const REPEL = 120, STRENGTH = 6000, FRICTION = 0.80;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x, my = mouse.current.y;
      for (const d of dots) {
        const dx = d.x - mx, dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL && dist > 0) {
          const force = (REPEL - dist) / REPEL;
          d.vx += (dx / dist) * force * force * STRENGTH * 0.016;
          d.vy += (dy / dist) * force * force * STRENGTH * 0.016;
        }
        d.vx += (d.bx - d.x) * 0.14; d.vy += (d.by - d.y) * 0.14;
        d.vx *= FRICTION; d.vy *= FRICTION;
        d.x += d.vx * 0.016; d.y += d.vy * 0.016;
        const off = Math.sqrt((d.x - d.bx) ** 2 + (d.y - d.by) ** 2);
        const t = Math.min(off / REPEL, 1);
        const r2 = Math.round(30 + t * 78), g2 = Math.round(27 + t * 72), b2 = Math.round(58 + t * 197);
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2 + t * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r2},${g2},${b2},${0.15 + t * 0.75})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

/* ─── Floating keywords ─────────────────────────────────────────────── */
const KEYWORDS = ["O(1)", "SQL", "REST", "gRPC", "CAP", "ACID", "JWT", "Redis", "Kafka", "TCP/IP", "B-Tree", "CQRS", "ETL", "OAuth", "CDN", "Sharding", "WAL", "Index", "Mutex", "Deadlock", "Saga", "Docker", "GraphQL", "WebSocket", "Bloom Filter", "Rate Limit", "Microservices", "Idempotent"];
type FloatWord = { id: number; word: string; x: number; y: number; dur: number; delay: number; size: number; opacity: number };

function FloatingKeywords() {
  const [words, setWords] = useState<FloatWord[]>([]);
  useEffect(() => {
    setWords(KEYWORDS.map((word, i) => ({
      id: i, word, x: 3 + Math.random() * 94, y: 3 + Math.random() * 94,
      dur: 16 + Math.random() * 20, delay: -(Math.random() * 25),
      size: 10 + Math.random() * 9, opacity: 0.055 + Math.random() * 0.085,
    })));
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {words.map((w) => (
        <span key={w.id} className="float-keyword" style={{ left: `${w.x}%`, top: `${w.y}%`, fontSize: `${w.size}px`, opacity: w.opacity, animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s` }}>
          {w.word}
        </span>
      ))}
    </div>
  );
}

/* ─── Difficulty badge ──────────────────────────────────────────────── */
function DifficultyBadge({ level }: { level: Difficulty }) {
  const map = { easy: "badge--easy", medium: "badge--medium", hard: "badge--hard" };
  const labels = { easy: "Easy", medium: "Medium", hard: "Hard" };
  return <span className={`diff-badge ${map[level]}`}>{labels[level]}</span>;
}

/* ─── Confetti burst ────────────────────────────────────────────────── */
function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useMemo(() => Array.from({ length: 38 }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    color: ["#6C63FF", "#22D3A5", "#f59e0b", "#ef4444", "#a78bfa", "#34d399"][i % 6],
    angle: Math.random() * 360,
    dist: 60 + Math.random() * 120,
    size: 5 + Math.random() * 6,
    delay: Math.random() * 0.3,
  })), []);

  if (!active) return null;
  return (
    <div className="confetti-root" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size, height: p.size,
            "--angle": `${p.angle}deg`,
            "--dist": `${p.dist}px`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Mini bar chart ────────────────────────────────────────────────── */
function ScoreChart({ scores, questions }: { scores: number[]; questions: typeof interviewQuestions }) {
  const max = 10;
  return (
    <div className="chart-root">
      {scores.map((s, i) => {
        const pct = (s / max) * 100;
        const color = s >= 9 ? "#22D3A5" : s >= 7 ? "#6C63FF" : s >= 4 ? "#f59e0b" : "#ef4444";
        const diff = questions[i]?.difficulty ?? "medium";
        return (
          <div key={i} className="chart-bar-col">
            <span className="chart-score-label" style={{ color }}>{s}</span>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ height: `${pct}%`, background: color }} />
            </div>
            <DifficultyBadge level={diff} />
            <span className="chart-q-label">Q{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Results screen ────────────────────────────────────────────────── */
function ResultsScreen({
  scores, questions, difficulty, onRestart, onHome,
}: {
  scores: number[];
  questions: typeof interviewQuestions;
  difficulty: Difficulty | "all";
  onRestart: () => void;
  onHome: () => void;
}) {
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = scores.length ? Math.round((total / scores.length) * 10) / 10 : 0;
  const best = scores.length ? Math.max(...scores) : 0;
  const grade = avg >= 9 ? "🏆 Outstanding" : avg >= 7 ? "⚡ Strong" : avg >= 5 ? "📈 Developing" : "💪 Keep Practicing";
  const showConfetti = avg >= 9;

  const sessions = loadSessions();

  return (
    <div className="results-root animate-fade-in">
      <ConfettiBurst active={showConfetti} />

      <div className="results-header">
        <div className="results-grade">{grade}</div>
        <h2 className="results-title">Interview Complete</h2>
        <p className="results-sub">Here's how you did across {scores.length} question{scores.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Stats row */}
      <div className="results-stats">
        <div className="results-stat">
          <span className="results-stat-val" style={{ color: avg >= 7 ? "#22D3A5" : avg >= 4 ? "#f59e0b" : "#ef4444" }}>{avg}</span>
          <span className="results-stat-label">Average</span>
        </div>
        <div className="results-stat">
          <span className="results-stat-val">{total}</span>
          <span className="results-stat-label">Total score</span>
        </div>
        <div className="results-stat">
          <span className="results-stat-val">{best}</span>
          <span className="results-stat-label">Best answer</span>
        </div>
        <div className="results-stat">
          <span className="results-stat-val">{scores.length}/{questions.length}</span>
          <span className="results-stat-label">Completed</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="results-chart-section">
        <div className="results-section-label">Score per question</div>
        <ScoreChart scores={scores} questions={questions} />
      </div>

      {/* Session history */}
      {sessions.length > 1 && (
        <div className="results-history-section">
          <div className="results-section-label">Past sessions</div>
          <div className="history-list">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={s.id} className={`history-row ${i === 0 ? "history-row--current" : ""}`}>
                <span className="history-date">{new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                <span className="history-diff"><DifficultyBadge level={s.difficulty === "all" ? "medium" : s.difficulty} /></span>
                <span className="history-qs">{s.answered}/{s.totalQuestions} Qs</span>
                <div className="history-bar-track">
                  <div className="history-bar-fill" style={{ width: `${(s.averageScore / 10) * 100}%` }} />
                </div>
                <span className="history-avg">{s.averageScore}/10</span>
              </div>
            ))}
          </div>
          <button className="clear-history-btn" onClick={() => { clearSessions(); }}>Clear history</button>
        </div>
      )}

      <div className="results-actions">
        <button onClick={onRestart} className="btn-primary btn-primary--large">Try Again <ArrowIcon /></button>
        <button onClick={onHome} className="btn-outline">Back to home</button>
      </div>
    </div>
  );
}

/* ─── Features / topics / landing data ─────────────────────────────── */
const FEATURES = [
  { icon: "⚡", title: "Instant Feedback", desc: "Scored after every answer with keyword matching, missing concepts, and what interviewers actually look for." },
  { icon: "🧠", title: "Smart Evaluation", desc: "Local logic checks your answers against ideal responses — no API, zero latency, nothing leaves your machine." },
  { icon: "📈", title: "Track Your Score", desc: "Watch your average climb question by question. Know exactly where you're strong and what to tighten up." },
  { icon: "✦", title: "Model Answers", desc: "Every question ships with a polished example answer showing the structure that earns 9s and 10s." },
];
const TOPICS = [
  { label: "Databases", items: ["ACID", "Indexing", "Sharding", "Transactions", "CAP Theorem"] },
  { label: "Networking", items: ["TCP/IP", "HTTP/2", "WebSockets", "DNS", "Load Balancing"] },
  { label: "Systems Design", items: ["Caching", "Message Queues", "Rate Limiting", "Pub/Sub", "CDNs"] },
  { label: "Auth & Security", items: ["JWT", "OAuth2", "RBAC", "HTTPS/TLS", "SQL Injection"] },
];
const SCORE_BANDS = [
  { range: "1–3", label: "Needs work", color: "#ef4444", desc: "Missing core concepts" },
  { range: "4–6", label: "Developing", color: "#f59e0b", desc: "Some concepts present" },
  { range: "7–8", label: "Strong", color: "#6C63FF", desc: "Clear and structured" },
  { range: "9–10", label: "Excellent", color: "#22D3A5", desc: "Definition + props + example" },
];

/* ─── Typing animation ──────────────────────────────────────────────── */
const CODE_LINES = [
  { text: `const result = evaluateAnswer(yourInput, keywords);`, color: "#e8e6f0" },
  { text: `//  score:   8 / 10`, color: "#6C63FF" },
  { text: `//  matched: ["ACID", "durability", "rollback"]`, color: "#22D3A5" },
  { text: `//  missing: ["isolation levels"]`, color: "#f59e0b" },
  { text: `//  tip:     add a concrete real-world example`, color: "#9B99AA" },
];
function TypingCode() {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (visible >= CODE_LINES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 750);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <>
      {CODE_LINES.slice(0, visible).map((line, i) => (
        <div key={i} className="code-line" style={{ color: line.color }}>
          {line.text}{i === visible - 1 && <span className="cursor-blink">▋</span>}
        </div>
      ))}
    </>
  );
}

/* ─── Difficulty selector ───────────────────────────────────────────── */
const DIFF_OPTIONS: { value: Difficulty | "all"; label: string; desc: string; color: string }[] = [
  { value: "all",    label: "All",    desc: "Mix of everything",    color: "#9B99AA" },
  { value: "easy",   label: "Easy",   desc: "Core concepts",        color: "#22D3A5" },
  { value: "medium", label: "Medium", desc: "Deeper topics",        color: "#f59e0b" },
  { value: "hard",   label: "Hard",   desc: "Advanced patterns",    color: "#ef4444" },
];

function DifficultySelector({
  selected, onChange,
}: { selected: Difficulty | "all"; onChange: (d: Difficulty | "all") => void }) {
  return (
    <div className="diff-selector">
      {DIFF_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`diff-option ${selected === opt.value ? "diff-option--active" : ""}`}
          style={{ "--diff-color": opt.color } as React.CSSProperties}
          onClick={() => onChange(opt.value)}
        >
          <span className="diff-option-label">{opt.label}</span>
          <span className="diff-option-desc">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Landing screen ────────────────────────────────────────────────── */
function LandingScreen({
  total, onStart, onReset, selectedDiff, onDiffChange, pastSessions,
}: {
  total: number;
  onStart: () => void;
  onReset: () => void;
  selectedDiff: Difficulty | "all";
  onDiffChange: (d: Difficulty | "all") => void;
  pastSessions: SessionRecord[];
}) {
  const filteredCount = selectedDiff === "all"
    ? interviewQuestions.length
    : interviewQuestions.filter((q) => q.difficulty === selectedDiff).length;

  return (
    <div className="landing-root">
      {/* Hero */}
      <section className="hero-section">
        <div className="landing-badge">
          <span className="badge-dot" />
          Offline · No API · {total} questions
        </div>
        <h1 className="landing-title">
          Ace Your<br />
          <span className="landing-title-accent">Backend Interview</span>
        </h1>
        <p className="landing-sub">
          Simulate real backend engineering interviews with instant scoring,
          keyword analysis, and model answers — 100% local, zero latency.
        </p>

        {/* Difficulty selector */}
        <div className="diff-selector-wrapper">
          <div className="diff-selector-label">Select difficulty</div>
          <DifficultySelector selected={selectedDiff} onChange={onDiffChange} />
          <div className="diff-count-hint">
            {filteredCount} question{filteredCount !== 1 ? "s" : ""} selected
          </div>
        </div>

        <div className="landing-cta">
          <button onClick={onStart} className="btn-primary btn-primary--large">
            Start Interview <ArrowIcon />
          </button>
          <button onClick={onReset} className="btn-outline">Reset</button>
        </div>

        {/* Terminal */}
        <div className="terminal-window">
          <div className="terminal-bar">
            <span className="t-dot t-dot--red" /><span className="t-dot t-dot--yellow" /><span className="t-dot t-dot--green" />
            <span className="terminal-title">interview_coach.ts</span>
          </div>
          <pre className="terminal-body"><TypingCode /></pre>
        </div>
      </section>

      {/* Past sessions on landing */}
      {pastSessions.length > 0 && (
        <section className="section-block">
          <h2 className="section-label">Recent sessions</h2>
          <div className="history-list">
            {pastSessions.slice(0, 3).map((s) => (
              <div key={s.id} className="history-row">
                <span className="history-date">{new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                <span className="history-diff"><DifficultyBadge level={s.difficulty === "all" ? "medium" : s.difficulty} /></span>
                <span className="history-qs">{s.answered}/{s.totalQuestions} Qs</span>
                <div className="history-bar-track">
                  <div className="history-bar-fill" style={{ width: `${(s.averageScore / 10) * 100}%` }} />
                </div>
                <span className="history-avg">{s.averageScore}/10</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Topics */}
      <section className="section-block">
        <h2 className="section-label">Topics covered</h2>
        <div className="topics-grid">
          {TOPICS.map((t) => (
            <div key={t.label} className="topic-card">
              <div className="topic-card-label">{t.label}</div>
              <div className="topic-tags">
                {t.items.map((item) => <span key={item} className="topic-tag">{item}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section-block">
        <h2 className="section-label">How it works</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score rubric */}
      <section className="section-block">
        <h2 className="section-label">Scoring rubric</h2>
        <div className="score-scale">
          {SCORE_BANDS.map((s) => (
            <div key={s.range} className="score-band" style={{ "--band-color": s.color } as React.CSSProperties}>
              <div className="score-band-range">{s.range}</div>
              <div className="score-band-bar" />
              <div className="score-band-label">{s.label}</div>
              <div className="score-band-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bottom-cta">
        <p className="bottom-cta-text">Ready to level up?</p>
        <button onClick={onStart} className="btn-primary btn-primary--large">
          Start Interview <ArrowIcon />
        </button>
      </section>
    </div>
  );
}

/* ─── Small reusable components ─────────────────────────────────────── */
function ScorePill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`score-pill ${accent ? "score-pill--accent" : ""}`}>
      <span className="score-pill-label">{label}</span>
      <span className="score-pill-value">{value}</span>
    </div>
  );
}
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function Page() {
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | "all">("all");
  const [showResults, setShowResults] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);

  useEffect(() => { setPastSessions(loadSessions()); }, []);

  const activeQuestions = useMemo(() =>
    selectedDiff === "all" ? interviewQuestions : interviewQuestions.filter((q) => q.difficulty === selectedDiff),
    [selectedDiff]
  );
  const total = activeQuestions.length;

  const makeInitialState = useCallback((): InterviewState => ({
    started: false, currentIndex: 0, thinking: false, totalScore: 0, scores: [], lastEvaluation: null, difficulty: selectedDiff,
  }), [selectedDiff]);

  const [state, setState] = useState<InterviewState>(makeInitialState);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: crypto.randomUUID(), role: "interviewer", content: randomFrom(interviewerGreetings), timestamp: Date.now() },
  ]);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, state.thinking]);

  function resetInterview() {
    setShowResults(false);
    setShowConfetti(false);
    setState(makeInitialState());
    setMessages([{ id: crypto.randomUUID(), role: "interviewer", content: randomFrom(interviewerGreetings), timestamp: Date.now() }]);
  }

  function goHome() { resetInterview(); }

  function pushMsg(role: "interviewer" | "user", content: string) {
    setMessages((p) => [...p, { id: crypto.randomUUID(), role, content, timestamp: Date.now() }]);
  }

  function startInterview() {
    if (state.started) return;
    if (total === 0) return;
    setState((s) => ({ ...s, started: true, currentIndex: 0, lastEvaluation: null, thinking: true, difficulty: selectedDiff }));
    setTimeout(() => {
      pushMsg("interviewer", `${randomFrom(startPrompts)}\n\n${activeQuestions[0].question}`);
      setState((s) => ({ ...s, thinking: false }));
    }, 900);
  }

  function averageScore(scores?: number[]) {
    const s = scores ?? state.scores;
    if (!s.length) return 0;
    return Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10;
  }

  function buildFeedbackText(result: EvaluationResult) {
    const openers = ["Thanks—here's my feedback.", "Got it. Here's how I'd evaluate that.", "Alright. Quick assessment:", "Okay—let's break this down."];
    const strengthLines = result.matchedKeywords.length > 0
      ? [`You covered: ${result.matchedKeywords.join(", ")}.`]
      : ["I didn't see key concepts explicitly called out."];
    const missingLines = result.missingKeywords.length > 0
      ? [`You missed: ${result.missingKeywords.join(", ")}.`]
      : ["Nice—this hits the main concepts I expected."];
    const nextSteps = ["Try: definition → key properties → example.", "Add a trade-off; that's what interviewers look for."];
    return [randomFrom(openers), `Score: ${result.score}/10.`, ...strengthLines, ...missingLines, randomFrom(nextSteps)].join("\n");
  }

  function finishInterview(finalScores: number[]) {
    const avg = averageScore(finalScores);
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      date: Date.now(),
      difficulty: selectedDiff,
      totalQuestions: total,
      answered: finalScores.length,
      totalScore: finalScores.reduce((a, b) => a + b, 0),
      averageScore: avg,
      scores: finalScores,
    };
    saveSession(record);
    setPastSessions(loadSessions());
    if (avg >= 9) setShowConfetti(true);
    setShowResults(true);
  }

  function askNextQuestion(nextIndex: number, currentScores: number[]) {
    if (nextIndex >= total) {
      finishInterview(currentScores);
      return;
    }
    const transitions = ["Let's move on.", "Next one.", "Alright—next question.", "Good. Here's the next one."];
    setState((s) => ({ ...s, thinking: true }));
    setTimeout(() => {
      const q = activeQuestions[nextIndex];
      pushMsg("interviewer", `${randomFrom(transitions)}\n\n${q.question}`);
      setState((s) => ({ ...s, thinking: false, currentIndex: nextIndex, lastEvaluation: null }));
    }, 1100 + Math.floor(Math.random() * 700));
  }

  async function handleSubmitAnswer(answer: string) {
    if (!state.started || state.thinking || state.currentIndex >= total) return;
    const trimmed = answer.trim();
    if (!trimmed) { pushMsg("interviewer", "Please type an answer."); return; }
    const q = activeQuestions[state.currentIndex];
    pushMsg("user", trimmed);
    setState((s) => ({ ...s, thinking: true }));
    const result = evaluateAnswer(trimmed, q.keywords, q.idealAnswer);
    setTimeout(() => {
      pushMsg("interviewer", `${buildFeedbackText(result)}\n\nModel answer:\n${result.improvedAnswer}`);
      setState((s) => {
        const scores = [...s.scores, result.score];
        const totalScore = s.totalScore + result.score;
        return { ...s, thinking: false, scores, totalScore, lastEvaluation: result };
      });
      const newScores = [...state.scores, result.score];
      setTimeout(() => askNextQuestion(state.currentIndex + 1, newScores), 900);
    }, 1000 + Math.floor(Math.random() * 900));
  }

  function handleImproveMyAnswer() {
    if (!state.started || state.thinking || state.currentIndex >= total) return;
    const q = activeQuestions[state.currentIndex];
    setState((s) => ({ ...s, thinking: true }));
    setTimeout(() => {
      pushMsg("interviewer", `Here's a polished version:\n\n${q.idealAnswer}`);
      setState((s) => ({ ...s, thinking: false }));
    }, 900 + Math.floor(Math.random() * 700));
  }

  const canAnswer = state.started && !state.thinking && state.currentIndex < total;
  const progress = total > 0 ? (state.currentIndex / total) * 100 : 0;
  const currentQ = activeQuestions[state.currentIndex];

  return (
    <>
      <ParticleCanvas />
      <FloatingKeywords />
      <main className="page-main">
        {showResults ? (
          <ResultsScreen
            scores={state.scores}
            questions={activeQuestions}
            difficulty={selectedDiff}
            onRestart={resetInterview}
            onHome={goHome}
          />
        ) : !state.started ? (
          <LandingScreen
            total={total}
            onStart={startInterview}
            onReset={resetInterview}
            selectedDiff={selectedDiff}
            onDiffChange={setSelectedDiff}
            pastSessions={pastSessions}
          />
        ) : (
          <div style={{ width: "100%", maxWidth: "768px", display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 2 }} className="animate-fade-in">
            <header className="interview-header">
              <div className="header-left">
                <div className="progress-label-row">
                  <span className="progress-label">{`Question ${clamp(state.currentIndex + 1, 1, total)} of ${total}`}</span>
                  {currentQ && <DifficultyBadge level={currentQ.difficulty} />}
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="header-scores">
                <ScorePill label="Avg" value={`${averageScore()}/10`} accent />
                <ScorePill label="Total" value={`${state.totalScore}`} />
              </div>
              <div className="header-actions">
                <button onClick={handleImproveMyAnswer} disabled={!canAnswer} className="btn-ghost btn-accent">
                  <span className="btn-icon">✦</span>Improve
                </button>
                <button onClick={resetInterview} className="btn-ghost">Restart</button>
              </div>
            </header>
            <ChatWindow messages={messages} thinking={state.thinking} onSubmit={handleSubmitAnswer} canAnswer={canAnswer} scrollAnchorRef={scrollAnchorRef} />
          </div>
        )}
      </main>
    </>
  );
}