import { Suspense } from 'react';
import LaunchClient from '@/app/templates/launch/template-launch-client';

export default function LaunchTemplatePage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          'linear-gradient(111.4deg, rgba(7,7,9,1) 6.5%, rgba(27,24,113,1) 93.2%)',
      }}
    >
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="mb-4 text-sm text-white/70">Templates / Launch</div>
        <Suspense fallback={<div className="text-sm text-white/70">Loading…</div>}>
          <LaunchClient />
        </Suspense>
      </div>
    </div>
  );
}
