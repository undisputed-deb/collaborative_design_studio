"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { jsPDF } from "jspdf";

export type Tool =
  | "select"
  | "pencil"
  | "rect"
  | "ellipse"
  | "text"
  | "eraser"
  | "image"
  | "comment"
  | "plumb";

type Point = { x: number; y: number };

type ShapeBase = { id: string; type: Tool; color: string };

type PencilShape = ShapeBase & { type: "pencil"; points: Point[]; strokeWidth: number };

type RectShape = ShapeBase & { type: "rect"; x: number; y: number; w: number; h: number };

type EllipseShape = ShapeBase & { type: "ellipse"; x: number; y: number; w: number; h: number };

type TextShape = ShapeBase & { type: "text"; x: number; y: number; text: string; fontSize: number };

type ImageShape = ShapeBase & { type: "image"; x: number; y: number; w: number; h: number; src: string };

export type Shape = PencilShape | RectShape | EllipseShape | TextShape | ImageShape;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useDebouncedCallback<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  const t = useRef<number | null>(null);
  return useCallback((...args: T) => {
    if (t.current) window.clearTimeout(t.current);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t.current = window.setTimeout(() => fn(...(args as any)), delay);
  }, [fn, delay]);
}

// Comments data (single collection with root pins and replies)
export type CommentDoc = {
  id: string;
  projectId: string;
  parentId: string | null;
  text: string;
  x: number | null;
  y: number | null;
  authorId: string;
  authorName?: string;
};

// Add multi-page support (150 pages like the pager)
const TOTAL_PAGES = 150 as const;

export default function StudioCanvas({ projectId }: { projectId: string }) {
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState<string>("#ffffff");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [version, setVersion] = useState<number>(0);

  const [, setPast] = useState<Shape[][]>([]);
  const [, setFuture] = useState<Shape[][]>([]);

  const [commentMode, setCommentMode] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Current page index (0-based)
  const [page, setPage] = useState<number>(0);

  // Initialize page from localStorage per project
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`project_page_v1_${projectId}`);
      const n = Math.max(0, Math.min(Number(raw) || 0, (TOTAL_PAGES as number) - 1));
      setPage(n);
    } catch {
      setPage(0);
    }
  }, [projectId]);

  const [dragId, setDragId] = useState<string | null>(null);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });
  const drawingId = useRef<string | null>(null);
  const startPoint = useRef<Point | null>(null);
  const isErasing = useRef<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);

  // RAF batching for ultra-smooth pencil drawing
  const rafPendingRef = useRef<boolean>(false);
  const bufferedPointsRef = useRef<Point[]>([]);
  const lastAddedPointRef = useRef<Point | null>(null);

  // Infinite canvas sizing
  const [canvasW, setCanvasW] = useState<number>(3000);
  const [canvasH, setCanvasH] = useState<number>(3000);

  // Selection and resizing
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const resizingRef = useRef<
    | null
    | {
        id: string;
        corner: "nw" | "ne" | "sw" | "se";
        start: { x: number; y: number; w: number; h: number };
      }
  >(null);

  // Helper to merge remote and local without losing in-progress strokes
  const mergeShapes = useCallback((local: Shape[], remote: Shape[]) => {
    const map = new Map<string, Shape>();
    remote.forEach((s) => map.set(s.id, s));
    local.forEach((s) => map.set(s.id, s)); // local wins for same id
    return Array.from(map.values());
  }, []);

  // Load a specific page's canvas state
  const loadPageState = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/projects/state?projectId=${encodeURIComponent(projectId)}&page=${p}`);
      const json = await res.json();
      if (!res.ok) return;
      const data = json?.data as { shapes?: Shape[] } | undefined;
      const remoteShapes = data?.shapes || [];
      setShapes(remoteShapes);
      setVersion((json?.version as number) ?? 0);
      setSelectedId(null);
      setPast([]);
      setFuture([]);
    } catch {
      // ignore
    }
  }, [projectId]);

  // Load initial + when project/page changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadPageState(page);
    })();
    return () => { cancelled = true; };
  }, [projectId, page, loadPageState]);

  // Poll for remote updates (canvas shapes) per page
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/state?projectId=${encodeURIComponent(projectId)}&page=${page}`);
        const json = await res.json();
        if (!res.ok) return;
        const remoteVersion = (json?.version as number) ?? 0;
        if (remoteVersion > version) {
          // If user is currently interacting (drawing/dragging/resizing/erasing), skip applying
          if (isInteractingRef.current || drawingId.current || resizingRef.current || isErasing.current || dragId) {
            return; // do not update version either; we'll merge when idle
          }
          const data = json?.data as { shapes?: Shape[] } | undefined;
          const remoteShapes = data?.shapes || [];
          setShapes((prev) => mergeShapes(prev, remoteShapes));
          setVersion(remoteVersion);
        }
      } catch {
        // ignore
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [projectId, page, version, mergeShapes, dragId]);

  // Comments polling
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/comments?projectId=${encodeURIComponent(projectId)}`);
        const json = await res.json();
        if (mounted && res.ok) {
          const list = (json?.comments as CommentDoc[] | undefined) || [];
          setComments(list);
        }
      } catch {
        // ignore
      }
    };
    void load();
    const t = window.setInterval(load, 2000);
    return () => { mounted = false; window.clearInterval(t); };
  }, [projectId]);

  // Expand canvas when scrolling near edges
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 500;
      if (el.scrollLeft + el.clientWidth > el.scrollWidth - threshold) {
        setCanvasW((w) => Math.min(20000, w + 1000));
      }
      if (el.scrollTop + el.clientHeight > el.scrollHeight - threshold) {
        setCanvasH((h) => Math.min(20000, h + 1000));
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const save = useCallback(
    async (draftShapes: Shape[], baseVersion: number) => {
      try {
        const res = await fetch('/api/projects/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, data: { shapes: draftShapes }, baseVersion, page }),
        });
        const json = await res.json();
        if (res.ok) setVersion(json.version as number);
      } catch {
        // ignore
      }
    },
    [projectId, page]
  );

  const debouncedSave = useDebouncedCallback((nextShapes: Shape[]) => {
    void save(nextShapes, version);
  }, 400);

  // Helper to commit state changes with history tracking
  const commit = useCallback((producer: (prev: Shape[]) => Shape[]) => {
    setShapes(prev => {
      const next = producer(prev);
      setPast(p => [...p.slice(-49), prev]);
      setFuture([]);
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  const undo = useCallback(() => {
    setPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      setShapes(current => {
        const last = prevPast[prevPast.length - 1];
        setFuture(f => [...f, current]);
        debouncedSave(last);
        return last;
      });
      return prevPast.slice(0, -1);
    });
  }, [debouncedSave]);

  const redo = useCallback(() => {
    setFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const last = prevFuture[prevFuture.length - 1];
      setShapes(current => {
        setPast(p => [...p, current]);
        debouncedSave(last);
        return last;
      });
      return prevFuture.slice(0, -1);
    });
  }, [debouncedSave]);

  // Navigate pages
  const gotoPage = useCallback(async (next: number) => {
    const target = clamp(next, 0, (TOTAL_PAGES as number) - 1);
    if (target === page) return;
    // Ensure any buffered strokes are flushed and current page is saved before switching
    flushBufferedPoints();
    await save(shapes, version);
    try { window.localStorage.setItem(`project_page_v1_${projectId}`, String(target)); } catch { /* ignore */ }
    setPage(target);
    await loadPageState(target);
  }, [page, projectId, save, shapes, version, loadPageState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Pointer helpers
  const getRelative = (e: React.PointerEvent) => {
    const scrollEl = scrollerRef.current;
    const rect = scrollEl?.getBoundingClientRect();
    if (!rect || !scrollEl) return { x: 0, y: 0 };
    return {
      x: clamp(e.clientX - rect.left + scrollEl.scrollLeft, 0, canvasW),
      y: clamp(e.clientY - rect.top + scrollEl.scrollTop, 0, canvasH),
    };
  };

  const getRelativeFromClient = (clientX: number, clientY: number) => {
    const scrollEl = scrollerRef.current;
    const rect = scrollEl?.getBoundingClientRect();
    if (!rect || !scrollEl) return { x: 0, y: 0 };
    return {
      x: clamp(clientX - rect.left + scrollEl.scrollLeft, 0, canvasW),
      y: clamp(clientY - rect.top + scrollEl.scrollTop, 0, canvasH),
    };
  };

  const eraseAt = (p: Point) => {
    commit((prev) => prev.filter((s) => !hitTest(s, p, 10)));
  };

  const flushBufferedPoints = () => {
    if (!drawingId.current || bufferedPointsRef.current.length === 0) return;
    const toAdd = [...bufferedPointsRef.current];
    bufferedPointsRef.current = [];
    lastAddedPointRef.current = null;
    setShapes(prev => prev.map(s => {
      if (s.id !== drawingId.current || s.type !== 'pencil') return s;
      return { ...s, points: [...(s as PencilShape).points, ...toAdd] } as PencilShape;
    }));
  };

  const scheduleRAFAppend = () => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      flushBufferedPoints();
      rafPendingRef.current = false;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // In Plumb mode, do not intercept any input; allow native scrolling with finger, mouse wheel, or trackpad
    if (tool === 'plumb') return;

    // Allow finger to scroll the canvas natively; only draw/interact with pen or mouse
    if (e.pointerType === 'touch') {
      isInteractingRef.current = false;
      return;
    }

    // For Pencil tool, restrict to stylus only (no finger or mouse)
    if (tool === 'pencil' && e.pointerType !== 'pen') {
      return;
    }

    e.preventDefault();
    try { (e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId); } catch { /* noop */ }

    const p = getRelative(e);

    if (commentMode) {
      const text = window.prompt('Leave a comment');
      if (text && text.trim().length > 0) {
        void fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, text, x: p.x, y: p.y }),
        }).then(async (res) => {
          if (res.ok) {
            const j = await res.json();
            const newId = (j?.id as string) || null;
            if (newId) setActivePinId(newId);
          }
        });
      }
      return;
    }

    isInteractingRef.current = true;

    if (tool === 'pencil') {
      const id = uid();
      const shape: PencilShape = { id, type: 'pencil', color, points: [p], strokeWidth: 2 };
      drawingId.current = id;
      lastAddedPointRef.current = p;
      commit((prev) => [...prev, shape]);
      setSelectedId(id);
    } else if (tool === 'rect' || tool === 'ellipse' || tool === 'image') {
      const id = uid();
      const base = { id, color } as const;
      if (tool === 'rect') {
        const shape: RectShape = { ...base, type: 'rect', x: p.x, y: p.y, w: 0, h: 0 };
        drawingId.current = id;
        startPoint.current = p;
        commit((prev) => [...prev, shape]);
        setSelectedId(id);
      } else if (tool === 'ellipse') {
        const shape: EllipseShape = { ...base, type: 'ellipse', x: p.x, y: p.y, w: 0, h: 0 };
        drawingId.current = id;
        startPoint.current = p;
        commit((prev) => [...prev, shape]);
        setSelectedId(id);
      } else if (tool === 'image') {
        // Image tool simply opens file picker; cancel this pointer
        fileInputRef.current?.click();
        isInteractingRef.current = false;
        return;
      }
    } else if (tool === 'text') {
      const text = window.prompt('Enter text');
      if (text) {
        const id = uid();
        const shape: TextShape = { id, type: 'text', x: p.x, y: p.y, text, fontSize: 16, color };
        commit((prev) => [...prev, shape]);
        setSelectedId(id);
      }
      isInteractingRef.current = false;
    } else if (tool === 'select') {
      // find topmost shape under pointer by simple hit test
      const found = [...shapes].reverse().find((s) => hitTest(s, p));
      if (found) {
        setSelectedId(found.id);
        setDragId(found.id);
        if ('x' in found && 'y' in found) {
          dragOffset.current = {
            x: p.x - (found as RectShape | EllipseShape | TextShape | ImageShape).x,
            y: p.y - (found as RectShape | EllipseShape | TextShape | ImageShape).y,
          };
        } else {
          dragOffset.current = { x: 0, y: 0 };
        }
        // push current state to history so move can be undone in one step
        setPast((prev) => [...prev.slice(-49), shapes]);
        setFuture([]);
      } else {
        setSelectedId(null);
        isInteractingRef.current = false;
      }
    } else if (tool === 'eraser') {
      isErasing.current = true;
      eraseAt(p);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (tool === 'plumb') return; // Plumb = scroll-only mode

    if (e.pointerType === 'touch') return; // let the page scroll naturally with a finger

    // For Pencil tool, restrict to stylus input during move as well
    if (tool === 'pencil' && e.pointerType !== 'pen') return;

    const p = getRelative(e);
    if (commentMode) return; // no drawing in comment mode

    if (isErasing.current && tool === 'eraser') {
      eraseAt(p);
      return;
    }

    // Resizing active
    if (resizingRef.current) {
      const info = resizingRef.current;
      setShapes((prev) => prev.map((s) => {
        if (s.id !== info.id) return s;
        if (s.type !== 'rect' && s.type !== 'ellipse' && s.type !== 'image') return s;
        let x = info.start.x;
        let y = info.start.y;
        let w = info.start.w;
        let h = info.start.h;
        if (info.corner === 'se') {
          w = clamp(p.x - info.start.x, 5, 20000);
          h = clamp(p.y - info.start.y, 5, 20000);
        } else if (info.corner === 'ne') {
          y = clamp(p.y, 0, 20000);
          h = clamp(info.start.y + info.start.h - p.y, 5, 20000);
          w = clamp(p.x - info.start.x, 5, 20000);
        } else if (info.corner === 'sw') {
          x = clamp(p.x, 0, 20000);
          w = clamp(info.start.x + info.start.w - p.x, 5, 20000);
          h = clamp(p.y - info.start.y, 5, 20000);
        } else if (info.corner === 'nw') {
          x = clamp(p.x, 0, 20000);
          y = clamp(p.y, 0, 20000);
          w = clamp(info.start.x + info.start.w - p.x, 5, 20000);
          h = clamp(info.start.y + info.start.h - p.y, 5, 20000);
        }
        return { ...s, x, y, w, h } as RectShape | EllipseShape | ImageShape;
      }));
      return;
    }

    if (drawingId.current) {
      setShapes((prev) => prev.map((s) => {
        if (s.id !== drawingId.current) return s;
        if (s.type === 'pencil') {
          // Use coalesced events for better stylus fidelity when available
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nativeEvt = (e as any).nativeEvent as PointerEvent;
          const events = typeof nativeEvt?.getCoalescedEvents === 'function' ? nativeEvt.getCoalescedEvents() : [nativeEvt];

          for (const ev of events) {
            const pt = getRelativeFromClient(ev.clientX, ev.clientY);
            const last = lastAddedPointRef.current;
            const dx = last ? pt.x - last.x : Infinity;
            const dy = last ? pt.y - last.y : Infinity;
            const dist = Math.hypot(dx, dy);
            // Skip points that are too close to reduce jitter/noise
            if (!last || dist > 0.7) {
              bufferedPointsRef.current.push(pt);
              lastAddedPointRef.current = pt;
            }
          }
          scheduleRAFAppend();
          return s; // actual points are appended in RAF to minimize re-renders
        }
        if ((s.type === 'rect' || s.type === 'ellipse') && startPoint.current) {
          const sx = startPoint.current.x;
          const sy = startPoint.current.y;
          return { ...s, x: Math.min(sx, p.x), y: Math.min(sy, p.y), w: Math.abs(p.x - sx), h: Math.abs(p.y - sy) } as RectShape | EllipseShape;
        }
        return s;
      }));
    } else if (dragId && tool === 'select') {
      setShapes((prev) => prev.map((s) => {
        if (s.id !== dragId) return s;
        if ('x' in s && 'y' in s) {
          return { ...s, x: p.x - dragOffset.current.x, y: p.y - dragOffset.current.y } as RectShape | EllipseShape | TextShape | ImageShape;
        }
        return s;
      }));
    }
  };

  const onPointerUp = () => {
    if (commentMode) return;
    if (isErasing.current) {
      isErasing.current = false;
    }
    if (resizingRef.current) {
      resizingRef.current = null;
    }
    if (drawingId.current) {
      // Flush any buffered stylus points before saving
      flushBufferedPoints();
      const finishedId = drawingId.current;
      drawingId.current = null;
      startPoint.current = null;
      // Save the most recent state
      setShapes(prev => {
        // ensure we still have the finished stroke present
        const next = [...prev];
        debouncedSave(next);
        return next;
      });
      // Keep selection on the just-finished shape
      if (finishedId) setSelectedId(finishedId);
    }
    if (dragId) {
      setDragId(null);
      setShapes(prev => {
        const next = [...prev];
        debouncedSave(next);
        return next;
      });
    }
    isInteractingRef.current = false;
  };

  const onPointerCancel = () => {
    isErasing.current = false;
    resizingRef.current = null;
    drawingId.current = null;
    startPoint.current = null;
    setDragId(null);
    isInteractingRef.current = false;
  };

  const hitTest = (s: Shape, p: Point, radius = 6) => {
    if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'image') {
      const rx = (s as RectShape | EllipseShape | ImageShape).x;
      const ry = (s as RectShape | EllipseShape | ImageShape).y;
      const rw = (s as RectShape | EllipseShape | ImageShape).w;
      const rh = (s as RectShape | EllipseShape | ImageShape).h;
      return p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh;
    }
    if (s.type === 'text') {
      const tx = (s as TextShape).x;
      const ty = (s as TextShape).y;
      return Math.abs(p.x - tx) < 40 && Math.abs(p.y - ty) < 20;
    }
    if (s.type === 'pencil') {
      const pts = (s as PencilShape).points;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (distToSegment(p, a, b) < radius) return true;
      }
    }
    return false;
  };

  const distToSegment = (p: Point, a: Point, b: Point) => {
    const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    return Math.hypot(p.x - proj.x, p.y - proj.y);
  };

  const toolbarButton = (t: Tool, icon: string, label: string) => (
    <button
      key={t}
      onClick={() => setTool(t)}
      className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${tool === t ? 'bg-white text-black border-white' : 'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}
      title={label}
    >
      <Icon icon={icon} /> {label}
    </button>
  );

  // Image import handler
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const id = uid();
      const w = 480;
      const h = 360;
      const x = (canvasW - w) / 2;
      const y = (canvasH - h) / 2;
      const shape: ImageShape = { id, type: 'image', x, y, w, h, src, color: '#ffffff' };
      commit((prev) => [...prev, shape]);
      setTool('select');
      setSelectedId(id);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Export as PDF
  const exportPDF = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(canvasW));
      canvas.height = Math.max(1, Math.floor(canvasH));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Use a dark background so white ink/text is visible in the exported PDF
      ctx.fillStyle = '#13131b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', orientation: canvasW >= canvasH ? 'landscape' : 'portrait', format: [canvas.width, canvas.height] });
      pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('whiteboard.pdf');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Export as PNG
  const exportPNG = async () => {
    const svg = svgRef.current; if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(canvasW));
      canvas.height = Math.max(1, Math.floor(canvasH));
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      // Match app's dark canvas so white drawings remain visible
      ctx.fillStyle = '#13131b';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'whiteboard.png'; a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Export as SVG
  const exportSVG = async () => {
    const svg = svgRef.current; if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'whiteboard.svg'; a.click(); URL.revokeObjectURL(url);
  };

  // Magic assistant panel
  const [showMagic, setShowMagic] = useState<boolean>(false);
  const [magicLoading, setMagicLoading] = useState<boolean>(false);
  const [magicPrompt, setMagicPrompt] = useState<string>("");
  const [magicReply, setMagicReply] = useState<string>("");

  const askMagic = async () => {
    if (!magicPrompt.trim()) return;
    setMagicLoading(true);
    setMagicReply("");
    try {
      const res = await fetch('/api/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, prompt: magicPrompt, shapes }),
      });
      const j = await res.json();
      const msg = (j?.message as string) || 'No response';
      setMagicReply(msg);
      // Do not auto-apply any actions to the board; keep results in chat only.
    } catch {
      setMagicReply('Something went wrong.');
    } finally {
      setMagicLoading(false);
    }
  };

  // Chat panel (polling)
  type Msg = { id: string; projectId: string; text: string; authorId: string; authorName?: string; createdAt?: unknown };
  const [showChat, setShowChat] = useState<boolean>(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/chat?projectId=${encodeURIComponent(projectId)}`);
        const j = await res.json();
        if (mounted && res.ok) setMessages(Array.isArray(j.messages) ? j.messages : []);
      } catch {
        // ignore
      }
    };
    void load();
    const t = window.setInterval(load, 2000);
    return () => { mounted = false; window.clearInterval(t); };
  }, [projectId]);

  // History (snapshots)
  type Snapshot = { id: string; label: string; data: { shapes?: Shape[] } };
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history?projectId=${encodeURIComponent(projectId)}`);
      const j = await res.json();
      if (res.ok) setHistory((Array.isArray(j.history) ? j.history : []) as Snapshot[]);
    } catch {
      // ignore
    }
  }, [projectId]);
  useEffect(() => { void loadHistory(); const t = window.setInterval(loadHistory, 5000); return () => window.clearInterval(t); }, [loadHistory]);

  const saveSnapshot = async () => {
    const label = window.prompt('Snapshot name', `v${version}`) || `v${version}`;
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, label, data: { shapes } }),
      });
      if (res.ok) void loadHistory();
    } catch {
      // ignore
    }
  };

  const pins = useMemo(() => comments.filter((c) => c.parentId === null && typeof c.x === 'number' && typeof c.y === 'number'), [comments]);
  const activeThread = useMemo(() => {
    if (!activePinId) return [] as CommentDoc[];
    const root = comments.find((c) => c.id === activePinId) || null;
    const replies = comments.filter((c) => c.parentId === activePinId);
    return root ? [root, ...replies] : replies;
  }, [comments, activePinId]);

  // Resize handles for selected image/shape
  const renderResizeHandles = (s: RectShape | EllipseShape | ImageShape) => {
    const handles: Array<{ key: string; x: number; y: number; corner: 'nw' | 'ne' | 'sw' | 'se' }> = [
      { key: 'nw', x: s.x, y: s.y, corner: 'nw' },
      { key: 'ne', x: s.x + s.w, y: s.y, corner: 'ne' },
      { key: 'sw', x: s.x, y: s.y + s.h, corner: 'sw' },
      { key: 'se', x: s.x + s.w, y: s.y + s.h, corner: 'se' },
    ];
    return handles.map((h) => (
      <rect
        key={`${s.id}-${h.key}`}
        x={h.x - 6}
        y={h.y - 6}
        width={12}
        height={12}
        fill="#ffffff"
        stroke="#000000"
        strokeWidth={1}
        onPointerDown={(ev) => {
          ev.stopPropagation();
          isInteractingRef.current = true;
          resizingRef.current = { id: s.id, corner: h.corner, start: { x: s.x, y: s.y, w: s.w, h: s.h } };
          // push to history so resize is one step
          setPast((prev) => [...prev.slice(-49), shapes]);
          setFuture([]);
        }}
        style={{ cursor: `${h.corner}-resize` as React.CSSProperties['cursor'] }}
      />
    ));
  };

  return (
    <div className="size-full flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      <div className="p-3 bg-white/5 border-b border-white/10 backdrop-blur overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
         {toolbarButton('select', 'solar:cursor-line-duotone', 'Select')}
         {toolbarButton('pencil', 'mdi:pencil', 'Pencil')}
         {toolbarButton('eraser', 'mdi:eraser', 'Eraser')}
         {toolbarButton('rect', 'material-symbols:rectangle', 'Rect')}
         {toolbarButton('ellipse', 'material-symbols:circle-outline', 'Circle')}
         {toolbarButton('text', 'mdi:text', 'Text')}
         {toolbarButton('image', 'mdi:image-plus', 'Image')}
         {toolbarButton('plumb', 'mdi:pan', 'Plumb')}
         <div className="ml-2 flex items-center gap-2 text-xs text-white/80">
           Color
           <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-9 p-0 bg-transparent border-none outline-none" />
         </div>
         {/* Page controls beside Magic AI */}
         <div className="ml-2 flex items-center gap-2">
           <button
             onClick={() => gotoPage(page - 1)}
             disabled={page <= 0}
             className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${page > 0 ? 'bg-white/0 text-white border-white/20 hover:bg-white/10' : 'cursor-not-allowed bg-white/0 text-white/40 border-white/10'}`}
             title="Previous page"
           >
             <Icon icon="material-symbols:chevron-left-rounded" /> Prev
           </button>
           <div className="px-2 py-1 rounded-lg border border-white/20 text-xs text-white/80">Page {page + 1} / {TOTAL_PAGES as number}</div>
           <button
             onClick={() => gotoPage(page + 1)}
             disabled={page >= (TOTAL_PAGES as number) - 1}
             className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${page < (TOTAL_PAGES as number) - 1 ? 'bg-white/0 text-white border-white/20 hover:bg-white/10' : 'cursor-not-allowed bg-white/0 text-white/40 border-white/10'}`}
             title="Next page"
           >
             Next <Icon icon="material-symbols:chevron-right-rounded" />
           </button>
         </div>
         <button
           onClick={() => setShowMagic(true)}
           className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white text-black border-white"
           title="Magic AI"
         >
           <Icon icon="mdi:sparkles" /> Magic AI
         </button>
         <div className="h-6 w-px bg-white/20 mx-2" />
         <button onClick={undo} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Undo (Ctrl/Cmd+Z)"><Icon icon="mdi:undo" /> Undo</button>
         <button onClick={redo} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Redo (Ctrl/Cmd+Shift+Z)"><Icon icon="mdi:redo" /> Redo</button>
         <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Import Image"><Icon icon="mdi:upload" /> Import</button>
         <button onClick={exportPNG} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white text-black border-white" title="Export as PNG"><Icon icon="mdi:image" /> PNG</button>
         <button onClick={exportSVG} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Export as SVG"><Icon icon="mdi:vector-square" /> SVG</button>
         <button onClick={exportPDF} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Export as PDF"><Icon icon="mdi:file-pdf-box" /> PDF</button>
         <button onClick={() => setCommentMode((v) => !v)} className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${commentMode ? 'bg-white text-black border-white' : 'bg-white/0 text-white border-white/20 hover:bg-white/10'}`} title="Comment Mode"><Icon icon="mdi:map-marker-plus" /> Comments</button>
         <button onClick={() => setShowChat((v) => !v)} className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${showChat ? 'bg-white text-black border-white' : 'bg-white/0 text-white border-white/20 hover:bg-white/10'}`} title="Chat"><Icon icon="material-symbols:chat" /> Chat</button>
         <button onClick={saveSnapshot} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white/0 text-white border-white/20 hover:bg-white/10" title="Save Snapshot"><Icon icon="material-symbols:history" /> Snapshot</button>
         <button onClick={() => setShowHistory((v)=>!v)} className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1 ${showHistory ? 'bg-white text-black border-white' : 'bg-white/0 text-white border-white/20 hover:bg-white/10'}`} title="History"><Icon icon="material-symbols:history" /> History</button>
         <div className="ml-auto text-xs text-white/60">v{version}</div>
         <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative">
        <div ref={scrollerRef} className="absolute inset-0 overflow-auto touch-pan-x touch-pan-y overscroll-contain">
          <div
            className="relative select-none"
            style={{ width: `${canvasW}px`, height: `${canvasH}px`, backgroundColor: 'transparent', backgroundImage: 'linear-gradient(#ffffff12 1px, transparent 1px), linear-gradient(90deg, #ffffff12 1px, transparent 1px)', backgroundSize: '40px 40px, 40px 40px' }}
          >
            <svg
              ref={svgRef}
              width={canvasW}
              height={canvasH}
              className={`cursor-${tool === 'plumb' ? 'grab' : 'crosshair'} block select-none`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              style={{ pointerEvents: tool === 'plumb' ? 'none' : 'auto' }}
            >
              {/* Existing shapes */}
              {shapes.map((s) => {
                const isSelected = selectedId === s.id;
                if (s.type === 'pencil') {
                  const d = (s as PencilShape).points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
                  return <path key={s.id} d={d} stroke={s.color} strokeWidth={(s as PencilShape).strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                }
                if (s.type === 'rect') {
                  const r = s as RectShape;
                  return (
                    <g key={s.id}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={`${s.color}33`} stroke={s.color} strokeWidth={1.5} />
                      {isSelected && renderResizeHandles(r)}
                    </g>
                  );
                }
                if (s.type === 'ellipse') {
                  const el = s as EllipseShape;
                  return (
                    <g key={s.id}>
                      <ellipse cx={el.x + el.w / 2} cy={el.y + el.h / 2} rx={Math.abs(el.w / 2)} ry={Math.abs(el.h / 2)} fill={`${s.color}33`} stroke={s.color} strokeWidth={1.5} />
                      {isSelected && renderResizeHandles(el)}
                    </g>
                  );
                }
                if (s.type === 'text') {
                  const t = s as TextShape;
                  return <text key={s.id} x={t.x} y={t.y} fontSize={t.fontSize} fill={t.color}>{t.text}</text>;
                }
                if (s.type === 'image') {
                  const im = s as ImageShape;
                  return (
                    <g key={s.id}>
                      <image href={im.src} x={im.x} y={im.y} width={im.w} height={im.h} preserveAspectRatio="none" />
                      {isSelected && (
                        <>
                          <rect x={im.x} y={im.y} width={im.w} height={im.h} fill="none" stroke="#ffffff" strokeDasharray="4 4" strokeWidth={1} />
                          {renderResizeHandles(im)}
                        </>
                      )}
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* Comment pins overlay inside scrollable area */}
            {pins.map((pin, idx) => (
              <button
                key={pin.id}
                onClick={() => setActivePinId(pin.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 size-6 rounded-full flex items-center justify-center text-[10px] border ${activePinId === pin.id ? 'bg-white text-black border-white' : 'bg-white/80 text-black border-black/10'}`}
                style={{ left: `${pin.x ?? 0}px`, top: `${pin.y ?? 0}px` }}
                title={pin.text}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Comments thread panel */}
        {activePinId && (
          <div className="absolute right-3 top-3 w-72 max-w-[85vw] bg-white/10 backdrop-blur rounded-lg border border-white/20 p-3 text-xs text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80">Comments</div>
              <button onClick={() => setActivePinId(null)} className="text-white/70 hover:text-white"><Icon icon="mdi:close" /></button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {activeThread.map((c) => (
                <div key={c.id} className="bg-white/5 rounded-md p-2 border border-white/10">
                  <div className="text-white/70">{c.authorName || 'User'}</div>
                  <div className="text-white/90">{c.text}</div>
                </div>
              ))}
              {activeThread.length === 0 && <div className="text-white/60">No comments yet.</div>}
            </div>
            <form
              className="mt-2 flex items-center gap-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.currentTarget as HTMLFormElement);
                const text = String(fd.get('reply') || '').trim();
                if (!text) return;
                void fetch('/api/comments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId, text, parentId: activePinId }),
                }).then(() => {
                  (ev.currentTarget as HTMLFormElement).reset();
                });
              }}
            >
              <input name="reply" placeholder="Write a reply..." className="flex-1 bg-white/10 border border-white/20 rounded-md px-2 py-1 outline-none placeholder:text-white/50" />
              <button className="px-2 py-1 rounded-md bg-white text-black border border-white">Send</button>
            </form>
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="absolute left-3 top-3 w-72 max-w-[85vw] bg-white/10 backdrop-blur rounded-lg border border-white/20 p-3 text-xs text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80 flex items-center gap-1"><Icon icon="material-symbols:chat" /> Chat</div>
              <button onClick={() => setShowChat(false)} className="text-white/70 hover:text-white"><Icon icon="mdi:close" /></button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {[...messages].sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))).map((m) => (
                <div key={m.id} className="bg-white/5 rounded-md p-2 border border-white/10">
                  <div className="text-white/70">{m.authorName || 'User'}</div>
                  <div className="text-white/90">{m.text}</div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-white/60">No messages yet.</div>}
            </div>
            <form
              className="mt-2 flex items-center gap-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                const fd = new FormData(ev.currentTarget as HTMLFormElement);
                const text = String(fd.get('msg') || '').trim();
                if (!text) return;
                void fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ projectId, text }),
                }).then(() => {
                  (ev.currentTarget as HTMLFormElement).reset();
                });
              }}
            >
              <input name="msg" placeholder="Type a message..." className="flex-1 bg-white/10 border border-white/20 rounded-md px-2 py-1 outline-none placeholder:text-white/50" />
              <button className="px-2 py-1 rounded-md bg-white text-black border border-white">Send</button>
            </form>
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div className="absolute right-3 bottom-3 w-72 max-w-[85vw] bg-white/10 backdrop-blur rounded-lg border border-white/20 p-3 text-xs text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/80 flex items-center gap-1"><Icon icon="material-symbols:history" /> History</div>
              <button onClick={() => setShowHistory(false)} className="text-white/70 hover:text-white"><Icon icon="mdi:close" /></button>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto pr-1">
              {[...history].map((h) => (
                <div key={h.id} className="bg-white/5 rounded-md p-2 border border-white/10 flex items-center justify-between gap-2">
                  <div className="truncate">{h.label}</div>
                  <button
                    className="px-2 py-1 rounded-md bg-white/0 text-white border border-white/20 hover:bg-white/10"
                    onClick={() => {
                      const next = (h.data?.shapes as Shape[] | undefined) || [];
                      setShapes(next);
                      debouncedSave(next);
                    }}
                  >View</button>
                </div>
              ))}
              {history.length === 0 && <div className="text-white/60">No snapshots yet.</div>}
            </div>
          </div>
        )}

        {/* Magic assistant modal */}
        {showMagic && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur rounded-xl border border-white/20 p-4 text-white text-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/80 flex items-center gap-2"><Icon icon="solar:magic-stick-3-linear" /> Magic Assistant</div>
                <button onClick={() => setShowMagic(false)} className="text-white/70 hover:text-white"><Icon icon="mdi:close" /></button>
              </div>
              <textarea value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} placeholder="Describe what you need help with..." className="w-full h-28 bg-white/10 border border-white/20 rounded-md p-2 outline-none placeholder:text-white/50" />
              <div className="mt-2 flex items-center gap-2">
                <button disabled={magicLoading} onClick={askMagic} className="px-3 py-2 rounded-lg border text-xs flex items-center gap-1 bg-white text-black border-white disabled:opacity-60">
                  {magicLoading ? 'Thinking…' : 'Ask'}
                </button>
              </div>
              {magicReply && (
                <div className="mt-3 bg-white/5 rounded-md p-2 border border-white/10 whitespace-pre-wrap">{magicReply}</div>
              )}
            </div>
          </div>
        )}

        {/* Comment mode hint */}
        {commentMode && (
          <div className="absolute left-3 bottom-3 text-xs text-white/80 bg-white/10 border border-white/20 rounded-md px-2 py-1">Comment mode: click anywhere to drop a pin</div>
        )}
      </div>
    </div>
  );
}