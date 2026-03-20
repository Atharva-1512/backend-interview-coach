"use client";

import type { ChatMessage } from "../types";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row--user" : "message-row--interviewer"}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="avatar avatar--interviewer" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 12.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div className={`bubble ${isUser ? "bubble--user" : "bubble--interviewer"}`}>
        <div className="bubble-content">
          {message.content}
        </div>
        <div className="bubble-meta">
          {isUser ? "You" : "Interviewer"} · {formatTime(message.timestamp)}
        </div>
      </div>

      {/* User avatar (right side) */}
      {isUser && (
        <div className="avatar avatar--user" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 12.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}