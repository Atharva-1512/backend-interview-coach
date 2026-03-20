"use client";

import type { ChatMessage } from "../types";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`mt-1 h-8 w-8 rounded-full ring-1 ring-white/10 ${
            isUser ? "bg-emerald-500/25" : "bg-indigo-500/25"
          }`}
          aria-hidden
        />
        <div
          className={`rounded-2xl px-4 py-3 ring-1 ring-white/10 ${
            isUser
              ? "rounded-tr-md bg-emerald-500/10"
              : "rounded-tl-md bg-black/30"
          }`}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
            {message.content}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {isUser ? "You" : "Interviewer"} · {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}