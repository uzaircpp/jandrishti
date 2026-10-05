// ==========================================
// JanDrishti - Influence network (canvas + d3-force)
// Nodes = accounts, edges = interactions. Hubs (KOLs) are larger and glow;
// the coordinated cluster is tinted red. Sentiment "pulses" travel edges to
// show spread. Click a node to inspect it.
// ==========================================
import React, { useEffect, useRef, useState } from 'react';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type Simulation, type SimulationNodeDatum,
} from 'd3-force';
import { EMO, CLUSTER_LABELS, type Node, type Edge } from '../data/sample';

type SimNode = Node & SimulationNodeDatum;
interface Props { nodes: Node[]; edges: Edge[]; height?: number; onSelect?: (n: Node | null) => void; selectedId?: string; showPulses?: boolean }

const CLUSTER_COLOR = ['#2583ee', '#3e9862', '#9b70c4', '#c2a900', '#d95645', '#85837a', '#2f7d50', '#5da7f4'];
const colorFor = (c: number) => CLUSTER_COLOR[((c % CLUSTER_COLOR.length) + CLUSTER_COLOR.length) % CLUSTER_COLOR.length];
const clusterName = (c: number) => CLUSTER_LABELS[c] ?? `Cluster ${c + 1}`;

export const InfluenceGraph: React.FC<Props> = ({ nodes, edges, height = 420, onSelect, selectedId, showPulses = true }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<Node | null>(null);
  const stateRef = useRef<{ sim?: Simulation<SimNode, undefined>; nodes: SimNode[]; pulses: { e: Edge; t: number; c: string }[]; raf: number; dpr: number; w: number; h: number }>({ nodes: [], pulses: [], raf: 0, dpr: 1, w: 0, h: 0 });

  useEffect(() => {
    const wrap = wrapRef.current!, canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const st = stateRef.current;
    const simNodes: SimNode[] = nodes.map(n => ({ ...n }));
    const byId = new Map(simNodes.map(n => [n.id, n]));
    const links = edges.map(e => ({ ...e }));
    st.nodes = simNodes;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      st.w = r.width; st.h = height; st.dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = st.w * st.dpr; canvas.height = st.h * st.dpr;
      canvas.style.width = `${st.w}px`; canvas.style.height = `${st.h}px`;
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    };
    resize();

    const sim = forceSimulation(simNodes)
      .force('link', forceLink(links).id((d: any) => d.id).distance((l: any) => (l.source.kol || l.target.kol ? 46 : 26)).strength(0.25))
      .force('charge', forceManyBody().strength((d: any) => (d.kol ? -190 : -46)))
      .force('center', forceCenter(st.w / 2, st.h / 2))
      .force('collide', forceCollide().radius((d: any) => (d.kol ? 22 : 8)))
      .alpha(1).alphaDecay(reduce ? 0.2 : 0.028);
    st.sim = sim;

    const nodeR = (n: SimNode) => (n.kol ? 9 + n.influence * 9 : 2.5 + n.influence * 5);
    const clamp = (n: SimNode) => { const r = nodeR(n) + 2; n.x = Math.max(r, Math.min(st.w - r, n.x!)); n.y = Math.max(r, Math.min(st.h - r, n.y!)); };

    let last = 0;
    const draw = (ts: number) => {
      const dt = ts - last; last = ts;
      simNodes.forEach(clamp);
      ctx.clearRect(0, 0, st.w, st.h);
      // edges
      ctx.lineWidth = 1;
      for (const l of links as any[]) {
        const coord = l.source.coord && l.target.coord;
        ctx.strokeStyle = coord ? 'rgba(197,69,58,0.22)' : 'rgba(37,131,238,0.10)';
        ctx.beginPath(); ctx.moveTo(l.source.x, l.source.y); ctx.lineTo(l.target.x, l.target.y); ctx.stroke();
      }
      // pulses
      if (showPulses && !reduce) {
        if (Math.random() < 0.05 && st.pulses.length < 8) {
          const l: any = links[Math.floor(Math.random() * links.length)];
          st.pulses.push({ e: l, t: 0, c: EMO[l.source.dominant as keyof typeof EMO]?.color || '#2583ee' });
        }
        for (const p of st.pulses) {
          p.t += dt / 900; const s: any = p.e.source, tg: any = p.e.target;
          const x = s.x + (tg.x - s.x) * p.t, y = s.y + (tg.y - s.y) * p.t;
          ctx.globalAlpha = 1 - p.t; ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        }
        st.pulses = st.pulses.filter(p => p.t < 1);
      }
      // nodes
      for (const n of simNodes) {
        const r = nodeR(n);
        const col = n.coord ? '#c5453a' : colorFor(n.cluster);
        if (n.kol) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x!, n.y!, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        if (n.kol) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5; ctx.stroke(); }
        if (n.id === selectedId || n.id === hover?.id) {
          ctx.strokeStyle = '#242b2f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x!, n.y!, r + 3, 0, 7); ctx.stroke();
        }
      }
      st.raf = requestAnimationFrame(draw);
    };
    st.raf = requestAnimationFrame(draw);

    const nodeAt = (mx: number, my: number) => {
      for (let i = simNodes.length - 1; i >= 0; i--) { const n = simNodes[i]; const r = nodeR(n) + 3; if ((n.x! - mx) ** 2 + (n.y! - my) ** 2 <= r * r) return n; }
      return null;
    };
    const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); const n = nodeAt(e.clientX - r.left, e.clientY - r.top); setHover(n); canvas.style.cursor = n ? 'pointer' : 'default'; };
    const onClick = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); onSelect?.(nodeAt(e.clientX - r.left, e.clientY - r.top)); };
    canvas.addEventListener('mousemove', onMove); canvas.addEventListener('click', onClick);
    const ro = new ResizeObserver(() => { resize(); sim.force('center', forceCenter(st.w / 2, st.h / 2)); sim.alpha(0.4).restart(); });
    ro.observe(wrap);

    return () => { cancelAnimationFrame(st.raf); sim.stop(); ro.disconnect(); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('click', onClick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, height, showPulses, selectedId]);

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
      {/* legend */}
      <div className="absolute left-3 top-3 flex flex-col gap-1 rounded-lg border border-border-default bg-white/85 px-3 py-2 backdrop-blur-sm">
        {Array.from(new Set(nodes.map(n => n.cluster))).sort((a, b) => a - b).slice(0, 6).map((c) => (
          <span key={c} className="flex items-center gap-2 text-[10px] text-text-secondary">
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: colorFor(c) }} />{clusterName(c)}
          </span>
        ))}
      </div>
      {hover && (
        <div className="pointer-events-none absolute right-3 top-3 w-44 rounded-lg border border-border-default bg-white px-3 py-2 shadow-dropdown text-xs">
          <p className="font-mono font-semibold text-text-primary">{hover.handle}</p>
          <p className="mt-1 text-text-tertiary">{hover.platform} · {clusterName(hover.cluster)}</p>
          <p className="mt-1 text-text-secondary">Reach ~{(hover.reach / 1000).toFixed(0)}k · infl {(hover.influence * 100).toFixed(0)}</p>
          {hover.coord && <p className="mt-1 font-semibold text-[#c5453a]">flagged: coordinated</p>}
        </div>
      )}
    </div>
  );
};
