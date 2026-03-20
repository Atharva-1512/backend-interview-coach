"use client";

export default function Loader() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-200">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-200 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-200 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-200" />
      </span>
      <span className="text-slate-300">Thinking…</span>
    </div>
  );
}