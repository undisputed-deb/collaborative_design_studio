'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatBubble, ChatRole } from '@/app/components/ChatBubble';
import { ChatInput } from '@/app/components/ChatInput';

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: ChatRole; text: string }>>([
    { role: 'ai', text: 'Hi! I\'m Magic AI. Ask me anything here — I\'ll reply in chat only and won\'t change your board.' },
  ]);
  const [input, setInput] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: input.trim() }]);
    setInput('');
  };

  const handleAskAI = async () => {
    if (!input.trim() || loadingAI) return;
    const prompt = input.trim();
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setInput('');
    setLoadingAI(true);
    try {
      const res = await fetch('/api/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, shapes: null }),
      });
      const data = await res.json();
      const text: string = typeof data?.message === 'string' ? data.message : (data?.error || 'Something went wrong');
      setMessages((m) => [...m, { role: 'ai', text }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Could not reach Magic AI right now.' }]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundImage: 'linear-gradient(111.4deg, rgba(7,7,9,1) 6.5%, rgba(27,24,113,1) 93.2%)' }}
    >
      <section className="mx-auto max-w-4xl px-4 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex items-center justify-between"
        >
          <h1 className="text-xl font-medium">Chat</h1>
          <span className="text-xs text-white/70">Magic AI replies here only</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="mb-3 max-h-[60vh] min-h-[40vh] space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} text={m.text} />
            ))}
          </div>
          <div className="border-t border-white/10 pt-3">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onAskAI={handleAskAI}
              loadingAI={loadingAI}
            />
            <p className="mt-2 text-[11px] text-white/60">No automatic actions will be taken on your board.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
