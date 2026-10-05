// ==========================================
// JanDrishti - Trending topics (Component D)
// Live trending topics with momentum, burst and a 12-hour forecast.
// Multi-select several topics to compare their audience mood side by side.
// ==========================================
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, ShieldAlert, Flame, Languages, Check, GitCompare, X } from 'lucide-react';
import { EMO, EMOTIONS, HOURS, type Narrative, type Emotion } from '../data/sample';
import { useData } from '../store/data.store';
import { Panel, EmotionChip, statusStyle, Meter } from '../components/shared';

const fullMix = (n: Narrative): Record<Emotion, number> => {
  const m = {} as Record<Emotion, number>;
  EMOTIONS.forEach(e => { m[e.key] = (n.mix as any)[e.key] || 0; });
  return m;
};

const StackBar: React.FC<{ mix: Record<Emotion, number>; h?: number }> = ({ mix, h = 10 }) => {
  const total = EMOTIONS.reduce((a, e) => a + mix[e.key], 0) || 1;
  return (
    <div className="flex rounded-full overflow-hidden" style={{ height: h }}>
      {EMOTIONS.map(e => mix[e.key] > 0 && (
        <div key={e.key} title={`${e.label} ${Math.round(mix[e.key] / total * 100)}%`}
          style={{ width: `${mix[e.key] / total * 100}%`, background: e.color }} />
      ))}
    </div>
  );
};

const ForecastChart: React.FC<{ n: Narrative }> = ({ n }) => {
  const data = [
    ...n.series.map((v, i) => ({ i, actual: v, forecast: null as number | null })),
    ...n.forecast.map((v, k) => ({ i: HOURS + k, actual: null as number | null, forecast: v })),
  ];
  data[HOURS - 1].forecast = n.series[HOURS - 1];
  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <defs>
          <linearGradient id={`na-${n.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2583ee" stopOpacity={0.3} /><stop offset="100%" stopColor="#2583ee" stopOpacity={0} /></linearGradient>
        </defs>
        <XAxis dataKey="i" hide />
        <ReferenceLine x={HOURS - 1} stroke="#b8aa8a" strokeDasharray="3 3" />
        <Area type="monotone" dataKey="actual" stroke="#2583ee" strokeWidth={2} fill={`url(#na-${n.id})`} isAnimationActive />
        <Area type="monotone" dataKey="forecast" stroke="#9b70c4" strokeWidth={2} strokeDasharray="4 3" fill="none" isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const Narratives: React.FC = () => {
  const NARRATIVES = useData(s => s.narratives);
  const [sel, setSel] = useState<string[]>([]);

  const toggle = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selected = NARRATIVES.filter(n => sel.includes(n.id));
  const single = selected.length <= 1 ? (selected[0] ?? NARRATIVES[0]) : null;
  const comparing = selected.length >= 2;

  // combined, volume-weighted emotion mix across the selected topics
  const combined = (() => {
    const acc = {} as Record<Emotion, number>; EMOTIONS.forEach(e => (acc[e.key] = 0));
    let posts = 0, accounts = 0;
    selected.forEach(n => { const m = fullMix(n); EMOTIONS.forEach(e => (acc[e.key] += m[e.key] * n.posts)); posts += n.posts; accounts += n.accounts; });
    const tot = EMOTIONS.reduce((a, e) => a + acc[e.key], 0) || 1;
    const pct = {} as Record<Emotion, number>; EMOTIONS.forEach(e => (pct[e.key] = Math.round(acc[e.key] / tot * 100)));
    return { pct, posts, accounts };
  })();

  return (
    <div className="animate-fade-in space-y-5 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trending topics</h1>
          <p className="text-sm text-text-secondary mt-1">Current viral topics, ranked by momentum. <b>Tick several</b> to compare their audience mood, or open one for its 12-hour forecast.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSel(NARRATIVES.slice(0, 5).map(n => n.id))}
            className="rounded-md border border-border-default bg-white/70 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-white transition">Compare top 5</button>
          {sel.length > 0 && (
            <button onClick={() => setSel([])}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white/70 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-white transition">
              <X className="w-3 h-3" /> Clear ({sel.length})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6">
        {/* selectable list */}
        <div className="space-y-3">
          {NARRATIVES.map(n => {
            const s = statusStyle(n.status);
            const on = sel.includes(n.id);
            return (
              <button key={n.id} onClick={() => toggle(n.id)}
                className={`w-full text-left card p-4 transition ${on ? 'ring-2 ring-gov-blue' : 'card-hover'}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${on ? 'bg-gov-blue border-gov-blue text-white' : 'border-border-strong bg-white/60'}`}>
                    {on && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {n.flagged && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#c5453a] bg-[#fbeae8] border border-[#e7b0aa] rounded px-1.5 py-0.5"><ShieldAlert className="w-3 h-3" />FLAGGED</span>}
                      <span className="line-clamp-2">{n.title}</span>
                    </p>
                    <div className="mt-2"><StackBar mix={fullMix(n)} /></div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-text-tertiary">
                      <span>{n.posts.toLocaleString('en-IN')} posts</span><span>·</span>
                      <span>{n.accounts.toLocaleString('en-IN')} accounts</span>
                      {n.burst >= 3 && <><span>·</span><span className="inline-flex items-center gap-1 text-amber-700"><Flame className="w-3 h-3" />burst ×{n.burst}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`badge border text-[10px] ${s.cls}`}>{s.label}</span>
                    <span className={`text-sm font-bold inline-flex items-center gap-1 ${n.momentum > 0 ? 'text-verified' : 'text-text-tertiary'}`}>
                      {n.momentum > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{n.momentum > 0 ? '+' : ''}{n.momentum}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* detail OR comparison */}
        <div className="lg:sticky lg:top-2 self-start w-full">
          {comparing ? (
            <Panel title={`Comparing ${selected.length} topics`} tag={<span className="inline-flex items-center gap-1"><GitCompare className="w-3 h-3" />combined mood</span>}>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-2">Combined audience mood · {combined.posts.toLocaleString('en-IN')} posts</p>
                  <StackBar mix={combined.pct as any} h={24} />
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {EMOTIONS.filter(e => combined.pct[e.key] > 0).map(e => (
                      <span key={e.key} className="inline-flex items-center gap-1 text-[10px] text-text-secondary">
                        <span className="h-2 w-2 rounded-sm" style={{ background: e.color }} />{e.label} {combined.pct[e.key]}%
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">Per topic</p>
                  {selected.map(n => (
                    <div key={n.id} className="rounded-lg border border-border-default bg-surface-secondary/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium text-text-primary line-clamp-2 flex-1">{n.title}</p>
                        <button onClick={() => toggle(n.id)} className="text-text-tertiary hover:text-text-primary flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="mt-2"><StackBar mix={fullMix(n)} /></div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-tertiary">
                        <EmotionChip emotion={Object.entries(fullMix(n)).sort((a, b) => b[1] - a[1])[0][0] as Emotion} small />
                        <span>{n.posts.toLocaleString('en-IN')} posts</span>
                        <span className={`ml-auto font-semibold ${n.momentum > 0 ? 'text-verified' : 'text-text-tertiary'}`}>{n.momentum > 0 ? '+' : ''}{n.momentum}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          ) : single ? (
            <Panel title={single.title} tag={single.flagged ? '⚑ flagged for coordination' : single.status}>
              <div className="p-5 space-y-4">
                <p className="text-sm text-text-secondary leading-relaxed">{single.summary}</p>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-2">Volume &amp; 12-hour forecast</p>
                  <ForecastChart n={single} />
                  <div className="flex items-center gap-4 mt-1 text-[10px] text-text-tertiary">
                    <span className="inline-flex items-center gap-1"><span className="w-4 h-0.5 bg-gov-blue inline-block" /> observed</span>
                    <span className="inline-flex items-center gap-1"><span className="w-4 border-t-2 border-dashed inline-block" style={{ borderColor: '#9b70c4' }} /> forecast</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-secondary border border-border-default p-3">
                    <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Emotion mix</p>
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(single.mix).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-16 text-[11px]" style={{ color: EMO[k as Emotion].color }}>{EMO[k as Emotion].label}</span>
                          <div className="flex-1"><Meter value={v as number} color={EMO[k as Emotion].color} /></div>
                          <span className="text-[11px] tabular-nums text-text-secondary w-8 text-right">{v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-secondary border border-border-default p-3">
                    <p className="text-[10px] uppercase tracking-wide text-text-tertiary">Where</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {single.topPlatforms.map(p => <span key={p} className="badge badge-review text-[10px]">{p}</span>)}
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-text-tertiary mt-3 flex items-center gap-1"><Languages className="w-3 h-3" />Languages</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {single.languages.map(l => <span key={l} className="badge text-[10px] bg-gray-100 text-gray-700 border border-gray-200">{l}</span>)}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary mb-2">Top keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {single.keywords.map(k => <span key={k} className="text-xs rounded-full bg-white border border-border-default px-2.5 py-1 text-text-secondary">{k}</span>)}
                  </div>
                </div>
                <p className="text-[11px] text-text-tertiary pt-1 border-t border-border-default">Tip: tick the checkboxes on the left to compare several topics at once.</p>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Narratives;
