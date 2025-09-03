import { Suspense } from 'react';
import StudioClient from '@/app/studio/studio-client';

export default function StudioPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          'linear-gradient(111.4deg, rgba(7,7,9,1) 6.5%, rgba(27,24,113,1) 93.2%)',
      }}
    >
      <div className="h-screen flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
          <a href="/dashboard" className="text-sm text-white/80 hover:text-white">← Back</a>
          <div className="text-sm text-white/70">Studio</div>
          <div />
        </div>
        <Suspense fallback={<div className="p-4 text-sm text-white/70">Loading...</div>}>
          <StudioClient />
        </Suspense>
      </div>
    </div>
  );
}
