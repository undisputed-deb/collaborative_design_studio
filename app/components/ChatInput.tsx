"use client";

import React from "react";
import { Icon } from "@iconify/react";

export function ChatInput({
  value,
  onChange,
  onSend,
  onAskAI,
  loadingAI,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAskAI: () => void;
  loadingAI?: boolean;
}) {
  return (
    <div className="flex w-full items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message…"
        className="min-h-[42px] max-h-36 w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/60 outline-none backdrop-blur focus:border-white/30"
      />
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="h-10 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white hover:bg-white/15 disabled:opacity-40"
      >
        Send
      </button>
      <button
        onClick={onAskAI}
        disabled={!value.trim() || loadingAI}
        title="Ask Magic AI"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white text-black hover:opacity-90 disabled:opacity-40"
      >
        {loadingAI ? (
          <Icon icon="svg-spinners:90-ring-with-bg" width={18} height={18} />
        ) : (
          <Icon icon="mdi:sparkles" width={18} height={18} />
        )}
      </button>
    </div>
  );
}
