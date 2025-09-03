'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TEMPLATE_LIST } from '@/lib/templates';

export default function LaunchClient() {
  const params = useSearchParams();
  const slug = params.get('template') || '';
  const info = TEMPLATE_LIST.find((t) => t.slug === slug);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!slug || !info) {
    return (
      <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur">
        <div className="text-lg">Template not found</div>
        <div className="mt-2 text-sm text-white/70">Choose a template from the gallery.</div>
        <Link href="/#templates" className="mt-4 inline-block px-3 py-2 rounded-lg bg-white text-black text-sm">Back to gallery</Link>
      </div>
    );
  }

  const create = async () => {
    setError(null);
    if (!name.trim()) { setError('Project name is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: slug, name: name.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Failed to create');
      const id: string = j.id as string;
      window.location.href = `/studio?projectId=${encodeURIComponent(id)}`;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 p-5 border border-white/10 backdrop-blur">
      <div className="text-lg">{info.title}</div>
      <div className="mt-1 text-sm text-white/70">{info.description}</div>
      <div className="mt-4 h-40 rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-400/10" />
      <div className="mt-4">
        <label className="block text-xs text-white/70 mb-1">Project name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name to continue"
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm outline-none placeholder:text-white/60"
        />
        {error && <div className="mt-1 text-xs text-rose-300">{error}</div>}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={create}
            disabled={creating || !name.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create board'}
          </button>
          <Link href="/#templates" className="px-4 py-2 rounded-lg bg-white/0 text-white border border-white/20 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
