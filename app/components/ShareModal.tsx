"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ShareModalProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

export default function ShareModal({ projectId, open, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/projects/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to invite");
      setStatus("Invitation sent");
      setEmail("");
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-5 text-white"
          >
            <h3 className="text-lg font-medium mb-2">Share Project</h3>
            <p className="text-xs text-white/70 mb-4">Invite a registered user by email.</p>
            <div className="flex items-center gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="collaborator@example.com"
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none placeholder:text-white/50"
              />
              <button
                onClick={invite}
                disabled={loading || !email}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Invite"}
              </button>
            </div>
            {status && <p className="text-xs mt-3 text-white/80">{status}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
