"use client";

import { useMemo, useState } from "react";
import type { ChatMessage } from "../types";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import Loader from "./Loader";

export default function ChatWindow({
  messages,
  thinking,
  onSubmit,
  canAnswer,
  scrollAnchorRef,
}: {
  messages: ChatMessage[];
  thinking: boolean;
  onSubmit: (value: string) => void | Promise<void>;
  canAnswer: boolean;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [draft, setDraft] = useState("");

  const placeholder = useMemo(() => {
    if (!canAnswer) return "Waiting for interviewer…";
    return "Type your answer  (Enter to send, Shift+Enter for new line)";
  }, [canAnswer]);

  return (
    <div className="chat-window">
      {/* Message list */}
      <div className="chat-messages">
        <div className="chat-messages-inner">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {thinking && (
            <div className="thinking-row">
              <div className="avatar avatar--interviewer">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 12.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="thinking-bubble">
                <Loader />
              </div>
            </div>
          )}

          <div ref={scrollAnchorRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <InputBox
          value={draft}
          onChange={setDraft}
          onSubmit={() => {
            const v = draft;
            setDraft("");
            onSubmit(v);
          }}
          disabled={!canAnswer}
          placeholder={placeholder}
        />
        <p className="chat-tip">
          <span className="chat-tip-icon">💡</span>
          Structure your answer: definition → key properties → example / trade-offs
        </p>
      </div>
    </div>
  );
}