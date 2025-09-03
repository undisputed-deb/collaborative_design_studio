"use client";

import { useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { jsPDF } from "jspdf";

type Tool = "pencil" | "rect" | "ellipse" | "text" | "image" | "eraser";

type Point = { x: number; y: number };

type ShapeBase = { id: string; type: Tool; color: string };

type PencilShape = ShapeBase & { type: "pencil"; points: Point[]; strokeWidth: number };

type RectShape = ShapeBase & { type: "rect"; x: number; y: number; w: number; h: number };

type EllipseShape = ShapeBase & { type: "ellipse"; x: number; y: number; w: number; h: number };

type TextShape = ShapeBase & { type: "text"; x: number; y: number; text: string; fontSize: number };

type ImageShape = ShapeBase & { type: "image"; x: number; y: number; w: number; h: number; src: string };

type Shape = PencilShape | RectShape | EllipseShape | TextShape | ImageShape;

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function SandboxWhiteboard() {
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState<string>("#ffffff");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const drawingId = useRef<string | null>(null);
  const startPoint = useRef<Point | null>(null);
  const dragId = useRef<string | null>(null);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });
  const isErasing = useRef<boolean>(false);

  const canvasW = 1600;
  const canvasH = 1000;

  const getRelative = (e: React.PointerEvent) => {
    const rect = scrollerRef.current?.getBoundingClientRect();
    const s = scrollerRef.current;
    if (!rect || !s) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left + s.scrollLeft, y: e.clientY - rect.top + s.scrollTop };
  };

  const hit = (s: Shape, p: Point, radius = 6) => {
    if (s.type === 'rect' || s.type === 'ellipse' || s.type === 'image') {
      const r = s as RectShape | EllipseShape | ImageShape;
      return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    }
    if (s.type === 'text') {
      const t = s as TextShape; return Math.abs(p.x - t.x) < 40 && Math.abs(p.y - t.y) < 20;
    }
    if (s.type === 'pencil') {
      const pts = (s as PencilShape).points; for (let i=0;i<pts.length-1;i++){ const a=pts[i]; const b=pts[i+1];
        const l2=(a.x-b.x)**2+(a.y-b.y)**2; if(l2===0) continue; let t=((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2; t=Math.max(0,Math.min(1,t));
        const q={x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)}; if (Math.hypot(p.x-q.x,p.y-q.y) < radius) return true; }
    }
    return false;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Let finger scroll; draw only with pen/mouse for a smoother mobile experience
    if (e.pointerType === 'touch') return;

    // Remove stylus-only restriction so mouse can draw as well
    // if (tool === 'pencil' && e.pointerType !== 'pen') return;

    const p = getRelative(e);
    if (tool === 'pencil') {
      const id = uid(); drawingId.current = id;
      setShapes(prev => [...prev, { id, type: 'pencil', color, points: [p], strokeWidth: 2 } as PencilShape]);
      setSelectedId(id);
    } else if (tool === 'rect' || tool === 'ellipse') {
      const id = uid(); drawingId.current = id; startPoint.current = p;
      if (tool === 'rect') setShapes(prev => [...prev, { id, type: 'rect', color, x: p.x, y: p.y, w: 0, h: 0 } as RectShape]);
      else setShapes(prev => [...prev, { id, type: 'ellipse', color, x: p.x, y: p.y, w: 0, h: 0 } as EllipseShape]);
      setSelectedId(id);
    } else if (tool === 'text') {
      const text = window.prompt('Enter text'); if (!text) return;
      const id = uid(); setShapes(prev => [...prev, { id, type: 'text', color, x: p.x, y: p.y, text, fontSize: 16 } as TextShape]);
      setSelectedId(id);
    } else if (tool === 'image') {
      fileInputRef.current?.click();
    } else if (tool === 'eraser') {
      isErasing.current = true;
      setShapes(prev => prev.filter(s => !hit(s, p, 16)));
    } else {
      // select/move
      const found = [...shapes].reverse().find(s => hit(s, p)) || null;
      dragId.current = found?.id || null; setSelectedId(found?.id || null);
      if (found && 'x' in found && 'y' in found) dragOffset.current = { x: p.x - (found as RectShape|EllipseShape|TextShape|ImageShape).x, y: p.y - (found as RectShape|EllipseShape|TextShape|ImageShape).y };
      else dragOffset.current = { x: 0, y: 0 };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // allow natural scroll with finger

    // Remove stylus-only restriction so mouse can draw as well
    // if (tool === 'pencil' && e.pointerType !== 'pen') return;

    const p = getRelative(e);
    if (isErasing.current && tool === 'eraser') { setShapes(prev => prev.filter(s => !hit(s, p, 16))); return; }
    if (drawingId.current) {
      setShapes(prev => prev.map(s => {
        if (s.id !== drawingId.current) return s;
        if (s.type === 'pencil') return { ...s, points: [...(s as PencilShape).points, p] } as PencilShape;
        if ((s.type === 'rect' || s.type === 'ellipse') && startPoint.current) {
          const sx = startPoint.current.x; const sy = startPoint.current.y;
          return { ...s, x: Math.min(sx, p.x), y: Math.min(sy, p.y), w: Math.abs(p.x - sx), h: Math.abs(p.y - sy) } as RectShape | EllipseShape;
        }
        return s;
      }));
    } else if (dragId.current && tool !== 'eraser') {
      setShapes(prev => prev.map(s => {
        if (s.id !== dragId.current) return s;
        if ('x' in s && 'y' in s) return { ...s, x: p.x - dragOffset.current.x, y: p.y - dragOffset.current.y } as RectShape | EllipseShape | TextShape | ImageShape;
        return s;
      }));
    }
  };

  const onPointerUp = () => { drawingId.current = null; startPoint.current = null; isErasing.current = false; dragId.current = null; };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      const id = uid(); const w = 360; const h = 240; const x = (canvasW - w) / 2; const y = (canvasH - h) / 2;
      setShapes(prev => [...prev, { id, type: 'image', x, y, w, h, src, color: '#ffffff' } as ImageShape]);
      setTool('pencil'); if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const exportPNG = useCallback(() => {
    const svg = svgRef.current; if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.fillStyle = '#13131b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'sandbox.png'; a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const exportSVG = useCallback(() => {
    const svg = svgRef.current; if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sandbox.svg'; a.click(); URL.revokeObjectURL(url);
  }, []);

  const exportPDF = useCallback(() => {
    const svg = svgRef.current; if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image(); img.onload = () => {
      const pdf = new jsPDF({ unit: 'px', orientation: canvasW >= canvasH ? 'landscape' : 'portrait', format: [canvasW, canvasH] });
      const canvas = document.createElement('canvas'); canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#13131b'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0);
      const png = canvas.toDataURL('image/png'); pdf.addImage(png, 'PNG', 0, 0, canvasW, canvasH); pdf.save('sandbox.pdf'); URL.revokeObjectURL(url);
    }; img.src = url;
  }, []);

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 text-xs text-white/90 overflow-x-auto">
        <button onClick={() => setTool('pencil')} className={`px-3 py-1.5 rounded-md border ${tool==='pencil'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="mdi:pencil" /> Pencil</button>
        <button onClick={() => setTool('rect')} className={`px-3 py-1.5 rounded-md border ${tool==='rect'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="material-symbols:rectangle" /> Rect</button>
        <button onClick={() => setTool('ellipse')} className={`px-3 py-1.5 rounded-md border ${tool==='ellipse'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="material-symbols:circle-outline" /> Circle</button>
        <button onClick={() => setTool('text')} className={`px-3 py-1.5 rounded-md border ${tool==='text'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="mdi:text" /> Text</button>
        <button onClick={() => setTool('image')} className={`px-3 py-1.5 rounded-md border ${tool==='image'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="mdi:image-plus" /> Image</button>
        <button onClick={() => setTool('eraser')} className={`px-3 py-1.5 rounded-md border ${tool==='eraser'?'bg-white text-black border-white':'bg-white/0 text-white border-white/20 hover:bg-white/10'}`}><Icon icon="mdi:eraser" /> Eraser</button>
        <div className="ml-2 flex items-center gap-2"><span className="text-white/70">Color</span><input type="color" value={color} onChange={(e)=>setColor(e.target.value)} className="h-7 w-9 bg-transparent border-none outline-none"/></div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShapes([])} className="px-3 py-1.5 rounded-md bg-white/0 text-white border border-white/20 hover:bg-white/10">Clear</button>
          <button onClick={exportPNG} className="px-3 py-1.5 rounded-md bg-white text-black border border-white">PNG</button>
          <button onClick={exportSVG} className="px-3 py-1.5 rounded-md bg-white/0 text-white border border-white/20 hover:bg-white/10">SVG</button>
          <button onClick={exportPDF} className="px-3 py-1.5 rounded-md bg-white/0 text-white border border-white/20 hover:bg-white/10">PDF</button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>
      <div ref={scrollerRef} className="relative h-[520px] overflow-auto touch-pan-x touch-pan-y overscroll-contain">
        <div className="relative" style={{ width: `${canvasW}px`, height: `${canvasH}px`, backgroundImage: 'linear-gradient(#ffffff12 1px, transparent 1px), linear-gradient(90deg, #ffffff12 1px, transparent 1px)', backgroundSize: '40px 40px, 40px 40px' }}>
          <svg
            ref={svgRef}
            width={canvasW}
            height={canvasH}
            className="block cursor-crosshair select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {shapes.map((s) => {
              if (s.type === 'pencil') {
                const pts = (s as PencilShape).points;
                const buildSmoothPath = (points: Point[]): string => {
                  if (points.length === 0) return '';
                  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
                  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
                  let d = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 1; i < points.length - 1; i++) {
                    const c = points[i];
                    const n = points[i + 1];
                    const mx = (c.x + n.x) / 2;
                    const my = (c.y + n.y) / 2;
                    d += ` Q ${c.x} ${c.y} ${mx} ${my}`;
                  }
                  const pn1 = points[points.length - 2];
                  const pn = points[points.length - 1];
                  d += ` Q ${pn1.x} ${pn1.y} ${pn.x} ${pn.y}`;
                  return d;
                };
                const d = buildSmoothPath(pts);
                return <path key={s.id} d={d} stroke={s.color} strokeWidth={(s as PencilShape).strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              }
              if (s.type === 'rect') { const r = s as RectShape; return <rect key={s.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={`${s.color}33`} stroke={s.color} strokeWidth={1.5} />; }
              if (s.type === 'ellipse') { const el = s as EllipseShape; return <ellipse key={s.id} cx={el.x + el.w/2} cy={el.y + el.h/2} rx={Math.abs(el.w/2)} ry={Math.abs(el.h/2)} fill={`${s.color}33`} stroke={s.color} strokeWidth={1.5} />; }
              if (s.type === 'text') { const t = s as TextShape; return <text key={s.id} x={t.x} y={t.y} fontSize={t.fontSize} fill={t.color}>{t.text}</text>; }
              if (s.type === 'image') { const im = s as ImageShape; return <image key={s.id} href={im.src} x={im.x} y={im.y} width={im.w} height={im.h} preserveAspectRatio="none" />; }
              return null;
            })}
            {selectedId && null}
          </svg>
        </div>
      </div>
    </div>
  );
}