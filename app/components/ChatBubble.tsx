"use client";

import React from "react";
import { Icon } from "@iconify/react";

export type ChatRole = "user" | "ai";

export function ChatBubble({ role, text }: { role: ChatRole; text: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 border border-white/20">
          <Icon icon="mdi:sparkles" className="text-cyan-200" width={16} height={16} />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed backdrop-blur border ${
          isUser
            ? "bg-white text-black border-white/80"
            : "bg-white/5 text-white border-white/15"
        }`}
      >
        {text}
      </div>
      {isUser && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
          <Icon icon="mdi:account" width={16} height={16} />
        </div>
      )}
    </div>
  );
}
