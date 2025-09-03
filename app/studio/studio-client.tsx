'use client';

import { useSearchParams } from 'next/navigation';
import StudioCanvas from '@/app/components/StudioCanvas';

export default function StudioClient() {
  const params = useSearchParams();
  const projectId = params.get('projectId') || '';

  if (!projectId) {
    return <div className="p-4 text-sm text-white/80">Missing projectId.</div>;
  }

  return (
    <div className="flex-1">
      {/* Canvas */}
      <div className="flex-1 min-h-0 h-[calc(100vh-52px)]">
        <StudioCanvas projectId={projectId} />
      </div>
    </div>
  );
}