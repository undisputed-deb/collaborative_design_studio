"use client";

import { memo } from "react";

export type TemplateSlug =
  | "brainstorm"
  | "flowchart"
  | "weekly-plan"
  | "kanban"
  | "mind-map"
  | "roadmap"
  | "retrospective"
  | "sprint-plan"
  | "journey";

function Tile({ className }: { className?: string }) {
  return (
    <div
      className={
        "rounded-md border border-white/10 bg-white/10 " + (className || "")
      }
    />
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <div className={"size-2 rounded-full bg-white/60 " + (className || "")} />
  );
}

function PreviewContent({ slug }: { slug: TemplateSlug }) {
  switch (slug) {
    case "kanban": {
      return (
        <div className="grid grid-cols-3 gap-2 h-full">
          {["To Do", "Doing", "Done"].map((_, i) => (
            <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-1.5">
              <div className="h-2 w-10 rounded bg-white/40" />
              <div className="mt-1 space-y-1.5">
                <Tile className="h-5" />
                <Tile className="h-8" />
                <Tile className="h-6" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "mind-map": {
      return (
        <div className="relative h-full">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-cyan-300/30 text-[10px] text-white px-2 py-1 border border-white/20">
            Central
          </div>
          {[[-36, -28], [-80, 12], [36, -28], [76, 12]].map(([x, y], i) => (
            <div
              key={i}
              className="absolute rounded bg-white/10 border border-white/15 text-[9px] text-white/80 px-1.5 py-1"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            >
              Node {i + 1}
            </div>
          ))}
          <svg className="absolute inset-0" viewBox="0 0 200 100">
            <g stroke="rgba(255,255,255,0.3)" strokeWidth="1">
              <line x1="100" y1="50" x2="50" y2="25" />
              <line x1="100" y1="50" x2="30" y2="60" />
              <line x1="100" y1="50" x2="150" y2="25" />
              <line x1="100" y1="50" x2="170" y2="60" />
            </g>
          </svg>
        </div>
      );
    }
    case "flowchart": {
      return (
        <div className="h-full flex flex-col items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-1/2 rounded-lg bg-white/10 border border-white/15 h-6" />
          ))}
        </div>
      );
    }
    case "weekly-plan": {
      return (
        <div className="grid grid-cols-7 gap-1 h-full">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="rounded bg-white/5 border border-white/10 p-1">
              <div className="h-2 w-6 rounded bg-white/40" />
              <div className="mt-1 space-y-1">
                <Tile className="h-3" />
                <Tile className="h-3" />
                <Tile className="h-3" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "retrospective": {
      return (
        <div className="grid grid-cols-3 gap-2 h-full">
          {["Keep", "Stop", "Start"].map((_, i) => (
            <div key={i} className="rounded bg-white/5 border border-white/10 p-1.5">
              <div className="h-2 w-8 rounded bg-white/40" />
              <div className="mt-1 space-y-1.5">
                <Tile className="h-4" />
                <Tile className="h-4" />
                <Tile className="h-4" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "roadmap": {
      return (
        <div className="h-full flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-white/10 border border-white/10 w-full" />
          ))}
        </div>
      );
    }
    case "sprint-plan": {
      return (
        <div className="grid grid-cols-2 gap-2 h-full">
          <div className="rounded bg-white/5 border border-white/10 p-1.5">
            <div className="h-2 w-10 rounded bg-white/40" />
            <div className="mt-1 space-y-1.5">
              <Tile className="h-5" />
              <Tile className="h-5" />
              <Tile className="h-5" />
            </div>
          </div>
          <div className="rounded bg-white/5 border border-white/10 p-1.5">
            <div className="h-2 w-10 rounded bg-white/40" />
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Tile key={i} className="h-6" />
              ))}
            </div>
          </div>
        </div>
      );
    }
    case "journey": {
      return (
        <div className="h-full grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded bg-white/5 border border-white/10 p-1.5">
              <div className="h-2 w-10 rounded bg-white/40" />
              <div className="mt-1 space-y-1.5">
                <Dot />
                <Dot />
                <Dot />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "brainstorm":
    default: {
      return (
        <div className="grid grid-cols-3 gap-2 h-full">
          {["#67e8f9", "#fbcfe8", "#a7f3d0", "#fde68a"].map((c, i) => (
            <div key={i} className="rounded bg-white/5 border border-white/10 p-1.5">
              <div
                className="h-8 rounded"
                style={{ backgroundColor: c, opacity: 0.5 }}
              />
            </div>
          ))}
        </div>
      );
    }
  }
}

function BoardPreview({ slug }: { slug: TemplateSlug }) {
  return (
    <div className="relative h-40 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10">
      <div className="absolute inset-0 [background-image:radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="absolute inset-0 [transform:perspective(900px)_rotateX(6deg)] p-2">
        <PreviewContent slug={slug} />
      </div>
      <div className="pointer-events-none absolute -inset-10 opacity-20 blur-2xl [background:conic-gradient(from_220deg_at_50%_50%,#67e8f9,transparent_35%,#a78bfa,transparent_70%,#67e8f9)]" />
    </div>
  );
}

export default memo(BoardPreview);
