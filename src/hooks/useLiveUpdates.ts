import { useEffect, useRef } from 'react';

/** Calls `fn` every `ms` while the tab is visible. Used to mimic the live pipeline feed. */
export function useLiveInterval(fn: () => void, ms: number) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; }, [fn]);
  useEffect(() => {
    let id: number;
    const tick = () => { if (!document.hidden) saved.current(); };
    id = window.setInterval(tick, ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

/** Simple count-up used by KPI tiles. */
export function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0; const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('en-IN');
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return ref;
}
