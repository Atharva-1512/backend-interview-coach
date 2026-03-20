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
    if (!canAnswer) return "Input disabled while the interviewer is thinking…";
    return "Type your answer…";
  }, [canAnswer]);

  return (
    <div className="flex h-[75vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {thinking && (
            <div className="flex items-start gap-2">
              <div className="mt-1 h-8 w-8 rounded-full bg-indigo-500/25 ring-1 ring-white/10" />
              <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-black/30 px-4 py-3 ring-1 ring-white/10">
                <Loader />
              </div>
            </div>
          )}

          <div ref={scrollAnchorRef} />
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20 p-3">
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
        <div className="mt-2 text-xs text-slate-400">
          Tip: Use a structure like definition → key properties → example/trade-offs.
        </div>
      </div>
    </div>
  );
}