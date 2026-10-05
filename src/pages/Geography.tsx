// ==========================================
// JanDrishti - Geographic view (real India map)
// SVG choropleth of India's 36 states/UTs, coloured by emotion. Driven by the
// model's national mix projected regionally. Pick an emotion or "Dominant";
// hover for a tooltip, click a state to pin its breakdown.
// ==========================================
import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { EMOTIONS, EMO, type Emotion } from '../data/sample';
import { useData } from '../store/data.store';
import { buildGeography, rampColor, REGION_NAME, type Region, type StateEmotion } from '../data/geo';
import { Panel, EmotionChip } from '../components/shared';
import indiaGeo from '../data/india-states.geo.json';

type Mode = Emotion | 'dominant';
type Feat = { type: string; properties: { st_nm: string }; geometry: any };
const FEATURES = (indiaGeo as any).features as Feat[];

// ---- projection (equirectangular with aspect correction) ----
const PAD = 12;
const proj = (() => {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
  const scan = (c: any) => {
    if (typeof c[0] === 'number') {
      minLon = Math.min(minLon, c[0]); maxLon = Math.max(maxLon, c[0]);
      minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
    } else c.forEach(scan);
  };
  FEATURES.forEach(f => scan(f.geometry.coordinates));
  const lat0 = ((minLat + maxLat) / 2) * Math.PI / 180;
  const kx = Math.cos(lat0);
  const H = 760;
  const scale = (H - PAD * 2) / (maxLat - minLat);
  const W = (maxLon - minLon) * kx * scale + PAD * 2;
  const project = (lon: number, lat: number): [number, number] => [
    (lon - minLon) * kx * scale + PAD,
    (maxLat - lat) * scale + PAD,
  ];
  return { project, W, H };
})();

function ringPath(ring: number[][]): string {
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = proj.project(ring[i][0], ring[i][1]);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d + 'Z';
}
function geomPath(geom: any): string {
  if (geom.type === 'Polygon') return geom.coordinates.map(ringPath).join('');
  if (geom.type === 'MultiPolygon') return geom.coordinates.map((poly: number[][][]) => poly.map(ringPath).join('')).join('');
  return '';
}
const PATHS = FEATURES.map(f => ({ name: f.properties.st_nm, d: geomPath(f.geometry) }));

const Geography: React.FC = () => {
  const { emotionTotals, online } = useData();
  const grandTotal = emotionTotals.reduce((a, e) => a + e.value, 0);
  const geo = useMemo(() => buildGeography(emotionTotals as any, grandTotal), [emotionTotals, grandTotal]);
  const statesArr = useMemo(() => Object.values(geo), [geo]);
  const [mode, setMode] = useState<Mode>('against');
  const [selName, setSelName] = useState<string | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  const rampLo = '#eceae4';
  const ext = useMemo(() => {
    const e: Record<string, { min: number; max: number }> = {};
    EMOTIONS.forEach(em => {
      const vals = statesArr.map(s => s.mix[em.key]);
      e[em.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return e;
  }, [statesArr]);

  const colorOf = (name: string) => {
    const s = geo[name]; if (!s) return '#e5e7e2';
    if (mode === 'dominant') return EMO[s.dominant].color;
    const { min, max } = ext[mode];
    return rampColor(EMO[mode].color, rampLo, (s.mix[mode] - min) / ((max - min) || 1));
  };

  const info = (hoverName && geo[hoverName]) || (selName && geo[selName]) || null;

  const nat = useMemo(() => {
    const acc: Record<string, number> = {}; let v = 0;
    statesArr.forEach(s => { EMOTIONS.forEach(e => { acc[e.key] = (acc[e.key] || 0) + s.mix[e.key] * s.volume; }); v += s.volume; });
    return EMOTIONS.map(e => ({ e, share: (acc[e.key] || 0) / (v || 1) }));
  }, [statesArr]);
  const natDom = [...nat].sort((a, b) => b.share - a.share)[0];

  const topStates = (em: Emotion, n = 5) => [...statesArr].sort((a, b) => b.mix[em] - a.mix[em]).slice(0, n);

  const regionRead = useMemo(() => {
    const regs: Record<string, { acc: Record<string, number>; v: number }> = {};
    statesArr.forEach(s => {
      regs[s.region] = regs[s.region] || { acc: {}, v: 0 };
      EMOTIONS.forEach(e => { regs[s.region].acc[e.key] = (regs[s.region].acc[e.key] || 0) + s.mix[e.key] * s.volume; });
      regs[s.region].v += s.volume;
    });
    return (Object.keys(regs) as Region[]).map(rk => {
      let dom = EMOTIONS[0].key, best = -1;
      EMOTIONS.forEach(e => { const share = regs[rk].acc[e.key] / (regs[rk].v || 1); if (share > best) { best = share; dom = e.key; } });
      return { region: rk, dom, share: best };
    }).sort((a, b) => b.share - a.share);
  }, [statesArr]);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Geographic view</h1>
        <p className="text-sm text-text-secondary mt-1">How the topic's mood varies across India. Pick an emotion to see where it runs hot, or <b>Dominant</b> for the leading feeling per state. Hover a state, click to pin it.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map(e => (
          <button key={e.key} onClick={() => setMode(e.key)} aria-pressed={mode === e.key}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${mode === e.key ? 'border-gov-blue bg-gov-blue-50 text-text-primary' : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />{e.label}
          </button>
        ))}
        <button onClick={() => setMode('dominant')} aria-pressed={mode === 'dominant'}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${mode === 'dominant' ? 'border-gov-blue bg-gov-blue-50 text-text-primary' : 'border-border-default bg-surface-primary text-text-secondary hover:bg-surface-secondary'}`}>
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'linear-gradient(90deg,#3e9862,#d95645)' }} />Dominant
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
        <Panel title="India · emotion map" tag={mode === 'dominant' ? 'dominant emotion per state' : `${EMO[mode].label} · intensity`}>
          <div className="p-5">
            <div className="relative mx-auto" style={{ maxWidth: 560 }}
              onMouseLeave={() => { setHoverName(null); setTip(null); }}>
              <svg viewBox={`0 0 ${proj.W} ${proj.H}`} width="100%" style={{ display: 'block', height: 'auto' }}
                role="img" aria-label="Emotion map of India by state">
                {PATHS.map(p => {
                  const active = p.name === hoverName || p.name === selName;
                  return (
                    <path key={p.name} d={p.d} fill={colorOf(p.name)}
                      stroke={active ? '#242b2f' : '#ffffff'} strokeWidth={active ? 1.6 : 0.6}
                      style={{ cursor: 'pointer', transition: 'fill .2s' }}
                      onMouseEnter={() => setHoverName(p.name)}
                      onMouseMove={e => { const r = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect(); setTip({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
                      onClick={() => setSelName(n => n === p.name ? null : p.name)} />
                  );
                })}
              </svg>
              {hoverName && tip && geo[hoverName] && (
                <div className="pointer-events-none absolute z-20 rounded-lg border border-border-default bg-white px-3 py-2 shadow-dropdown text-xs"
                  style={{ left: Math.min(tip.x + 12, 400), top: tip.y + 12 }}>
                  <p className="font-semibold text-text-primary">{hoverName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-text-secondary">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: EMO[geo[hoverName].dominant].color }} />
                    {mode === 'dominant'
                      ? <>dominant: {EMO[geo[hoverName].dominant].label}</>
                      : <>{EMO[mode].label}: {(geo[hoverName].mix[mode] * 100).toFixed(0)}%</>}
                  </p>
                  <p className="mt-0.5 text-text-tertiary">{geo[hoverName].volume.toLocaleString('en-IN')} posts</p>
                </div>
              )}
            </div>

            {mode === 'dominant' ? (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
                {EMOTIONS.map(e => (
                  <span key={e.key} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: e.color }} />{e.label}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 max-w-[460px] mx-auto">
                <span className="text-[11px] text-text-tertiary tabular-nums">{Math.round(ext[mode].min * 100)}%</span>
                <div className="h-3 flex-1 rounded-md border border-border-default"
                  style={{ background: `linear-gradient(90deg, ${rampColor(EMO[mode].color, rampLo, 0)}, ${rampColor(EMO[mode].color, rampLo, 0.5)}, ${rampColor(EMO[mode].color, rampLo, 1)})` }} />
                <span className="text-[11px] text-text-tertiary tabular-nums">{Math.round(ext[mode].max * 100)}%</span>
                <span className="text-[11px] font-medium ml-1" style={{ color: EMO[mode].color }}>{EMO[mode].label}</span>
              </div>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          {info ? (
            <Panel title={info.name} tag={`${REGION_NAME[info.region]} · ${info.volume.toLocaleString('en-IN')} posts`}>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm"><span className="text-text-tertiary">Dominant mood:</span><EmotionChip emotion={info.dominant} small /></div>
                <div className="space-y-1.5">
                  {EMOTIONS.map(e => ({ e, v: info.mix[e.key] })).sort((a, b) => b.v - a.v).map(({ e, v }) => (
                    <div key={e.key} className="grid grid-cols-[84px_1fr_38px] items-center gap-2.5">
                      <span className="text-[11px]" style={{ color: e.color }}>{e.label}</span>
                      <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden"><div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: e.color }} /></div>
                      <span className="text-[11px] tabular-nums text-text-secondary text-right">{(v * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                {!selName && <p className="text-[11px] text-text-tertiary pt-1">Click the state to pin this panel.</p>}
              </div>
            </Panel>
          ) : (
            <Panel title="National mood" tag="volume-weighted">
              <div className="p-5 space-y-4">
                <div className="flex h-7 rounded-lg overflow-hidden border border-border-default">
                  {nat.map(({ e, share }) => <div key={e.key} title={`${e.label} ${(share * 100).toFixed(0)}%`} style={{ width: `${share * 100}%`, background: e.color }} />)}
                </div>
                <p className="text-sm text-text-secondary">Across India this topic reads mostly <b style={{ color: EMO[natDom.e.key].color }}>{natDom.e.label.toLowerCase()}</b> ({(natDom.share * 100).toFixed(0)}%).</p>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-2">Regional read</p>
                  <div className="grid grid-cols-2 gap-2">
                    {regionRead.map(r => (
                      <div key={r.region} className="rounded-lg border border-border-default bg-surface-secondary p-2.5">
                        <p className="text-xs text-text-tertiary">{REGION_NAME[r.region as Region]}</p>
                        <p className="text-sm font-semibold" style={{ color: EMO[r.dom].color }}>{EMO[r.dom].label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {mode !== 'dominant' && (
            <Panel title={`Where ${EMO[mode].label.toLowerCase()} runs hottest`} tag="top states">
              <div className="p-4 space-y-2.5">
                {topStates(mode).map((s, i) => {
                  const mx = ext[mode].max || 1;
                  return (
                    <button key={s.name} onClick={() => setSelName(s.name)} className="w-full text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono text-text-tertiary w-4">{i + 1}</span>
                        <span className="text-sm text-text-primary flex-1 truncate">{s.name}</span>
                        <span className="text-[11px] tabular-nums text-text-secondary">{(s.mix[mode] * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 mt-1 rounded-full bg-surface-tertiary overflow-hidden ml-6"><div className="h-full rounded-full" style={{ width: `${s.mix[mode] / mx * 100}%`, background: EMO[mode].color }} /></div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-text-tertiary">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>State values are a regional projection of the {online ? 'live model’s' : 'sample'} national emotion mix (engagement is highest where the topic is based). The production build geo-locates posts directly from profile and language signals for true per-state figures. State boundaries are indicative.</p>
      </div>
    </div>
  );
};

export default Geography;
