"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const TOTAL_PAGES = 150 as const;
const AREAS_PER_PAGE = 4 as const;

type PageIndex = number; // 0-based index

type PageContent = [string, string, string, string];

type PageButton = number | "...";

function makeEmptyPage(): PageContent {
  return ["", "", "", ""];
}

function loadFolder(folderId: string): PageContent[] {
  if (typeof window === "undefined") return Array.from({ length: TOTAL_PAGES }, makeEmptyPage);
  try {
    const raw = window.localStorage.getItem(`folder_pages_v1_${folderId}`);
    if (!raw) return Array.from({ length: TOTAL_PAGES }, makeEmptyPage);
    const data = JSON.parse(raw) as string[][];
    const normalized: PageContent[] = Array.from({ length: TOTAL_PAGES }, (_, i) => {
      const src = data[i] ?? makeEmptyPage();
      const filled = [src[0] ?? "", src[1] ?? "", src[2] ?? "", src[3] ?? ""];
      return [filled[0], filled[1], filled[2], filled[3]];
    });
    return normalized;
  } catch {
    return Array.from({ length: TOTAL_PAGES }, makeEmptyPage);
  }
}

function buildButtons(currentHuman: number): PageButton[] {
  const total = TOTAL_PAGES as number;
  const buttons: PageButton[] = [];

  const add = (v: PageButton) => {
    if (buttons.length === 0 || buttons[buttons.length - 1] !== v) buttons.push(v);
  };

  add(1);
  add(2);

  if (currentHuman > 5) add("...");

  const start = Math.max(3, currentHuman - 2);
  const end = Math.min(total - 2, currentHuman + 2);
  for (let i = start; i <= end; i++) add(i);

  if (currentHuman < total - 4) add("...");

  add(total - 1);
  add(total);

  // Remove duplicates and out-of-range, keep ellipsis positions
  const seenNum = new Set<number>();
  return buttons.filter((b) => {
    if (b === "...") return true;
    if (b < 1 || b > total) return false;
    if (seenNum.has(b)) return false;
    seenNum.add(b);
    return true;
  });
}

export default function FolderPager({ folderId }: { folderId: string }) {
  const [current, setCurrent] = useState<PageIndex>(0);
  const [pages, setPages] = useState<PageContent[]>(() => loadFolder(folderId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reload when folder changes
    setPages(loadFolder(folderId));
    setCurrent(0);
  }, [folderId]);

  useEffect(() => {
    setSaving(true);
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(`folder_pages_v1_${folderId}`, JSON.stringify(pages));
      } finally {
        setSaving(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [pages, folderId]);

  const pageHuman = current + 1;
  const canPrev = current > 0;
  const canNext = current < TOTAL_PAGES - 1;
  const currentPage = pages[current];

  function updateArea(areaIndex: 0 | 1 | 2 | 3, value: string) {
    setPages((prev) => {
      const next = [...prev];
      const cur = [...next[current]] as PageContent;
      cur[areaIndex] = value;
      next[current] = cur;
      return next;
    });
  }

  const areas = useMemo(() => Array.from({ length: AREAS_PER_PAGE }, (_, i) => i as 0 | 1 | 2 | 3), []);
  const pageButtons = useMemo(() => buildButtons(pageHuman), [pageHuman]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">Folder</span>
          <span className="text-sm text-white/70">{folderId}</span>
          <span className="text-sm text-white/70">• Page {pageHuman} of {TOTAL_PAGES}</span>
          {saving && <span className="text-xs text-white/50">Saving…</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && setCurrent((c) => c - 1)}
            disabled={!canPrev}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${canPrev ? "border-white/20 bg-white/0 text-white hover:bg-white/10" : "cursor-not-allowed border-white/10 bg-white/0 text-white/40"}`}
            aria-label="Previous page"
          >
            <Icon icon="material-symbols:chevron-left-rounded" /> Prev
          </button>
          <div className="hidden md:flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1">
            {pageButtons.map((b, i) => (
              b === "..." ? (
                <span key={`e-${i}`} className="px-2 text-xs text-white/50">…</span>
              ) : (
                <button
                  key={`p-${b}`}
                  onClick={() => setCurrent(b - 1)}
                  className={`px-2 py-1 rounded-md text-xs ${b === pageHuman ? "bg-white text-black" : "bg-white/0 text-white hover:bg-white/10"}`}
                >
                  {b}
                </button>
              )
            ))}
          </div>
          <button
            onClick={() => canNext && setCurrent((c) => c + 1)}
            disabled={!canNext}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${canNext ? "border-white/20 bg-white/0 text-white hover:bg-white/10" : "cursor-not-allowed border-white/10 bg-white/0 text-white/40"}`}
            aria-label="Next page"
          >
            Next <Icon icon="material-symbols:chevron-right-rounded" />
          </button>
        </div>
      </motion.div>

      <motion.div
        key={current}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {areas.map((i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/0 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-white/60">Area {i + 1} of {AREAS_PER_PAGE}</span>
                <span className="text-[10px] text-white/40">Page {pageHuman}</span>
              </div>
              <textarea
                value={currentPage[i]}
                onChange={(e) => updateArea(i, e.target.value)}
                placeholder="Start writing here..."
                className="h-48 w-full resize-y rounded-lg border border-white/10 bg-white/0 p-3 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/5"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}