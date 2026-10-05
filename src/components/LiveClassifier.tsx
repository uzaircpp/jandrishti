// ==========================================
// JanDrishti - Live emotion classifier
// The "the AI is real" moment: type any post (English / Hinglish / Devanagari)
// and the trained model classifies it live via POST /api/classify.
// ==========================================
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CornerDownLeft, Cpu } from 'lucide-react';
import { EMOTIONS, EMO, type Emotion } from '../data/sample';
import { classifyText, useData } from '../store/data.store';

const EXAMPLES = [
  '₹40 for an 8km ride every day is too expensive for students',
  'wah, ek train jo time pe chalti hai, socha nahi tha ye din dekhenge',
  'सकाळी खूप गर्दी होती, आणखी डबे हवेत',
  'cannot wait for the launch tomorrow, so excited for the first ride',
  'last train kitne baje hai koi bata dega',
];

type Result = { emotion: string; confidence: number; scores: Record<string, number> };

export const LiveClassifier: React.FC = () => {
  const online = useData(s => s.online);
  const metrics = useData(s => s.metrics);
  const [text, setText] = useState(EXAMPLES[0]);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr(null);
    try {
      setRes(await classifyText(text));
    } catch {
      setErr('Backend offline — start the API (python app.py) to run the live model.');
    } finally { setBusy(false); }
  };

  const ranked = res
    ? EMOTIONS.map(e => ({ e, v: res.scores[e.key] ?? 0 })).sort((a, b) => b.v - a.v)
    : [];

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-default bg-gradient-to-r from-ai-purple-50 to-transparent">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai-purple-50 text-ai-purple-dark"><Sparkles className="w-4 h-4" /></span>
        <h3 className="text-sm font-semibold text-text-primary">Live emotion model</h3>
        <span className="text-[11px] text-text-tertiary">trained · multilingual</span>
        {metrics && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border-default bg-white px-2.5 py-1 text-[10px] font-semibold text-text-secondary">
            <Cpu className="w-3 h-3" />
            {metrics.name
              ? <>{metrics.name}{metrics.kind ? ` · ${metrics.kind}` : ''}</>
              : <>macro-F1 {((metrics.macro_f1 ?? 0) * 100).toFixed(0)}% · {(metrics.samples ?? 0).toLocaleString('en-IN')} samples</>}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="relative">
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') run(); }}
            rows={2} placeholder="Type a post in English, Hinglish or Devanagari…"
            className="w-full resize-none rounded-lg border border-border-default bg-surface-primary px-3 py-2.5 pr-28 text-sm text-text-primary outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20"
          />
          <button onClick={run} disabled={busy}
            className="absolute right-2 bottom-2 inline-flex items-center gap-1.5 rounded-md bg-gov-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-gov-blue-dark disabled:opacity-50 transition">
            {busy ? 'Analysing…' : <>Classify <CornerDownLeft className="w-3 h-3" /></>}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button key={i} onClick={() => setText(ex)}
              className="text-[11px] rounded-full border border-border-default bg-surface-secondary px-2.5 py-1 text-text-secondary hover:bg-surface-tertiary transition max-w-[220px] truncate">
              {ex}
            </button>
          ))}
        </div>

        {err && <p className="text-xs text-error font-medium">{err}</p>}
        {!online && !err && <p className="text-[11px] text-text-tertiary">Showing bundled sample data. Start the backend to run the live model and real pipeline.</p>}

        {res && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-tertiary">Prediction</span>
              <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold"
                style={{ color: EMO[res.emotion as Emotion].color, background: EMO[res.emotion as Emotion].soft, border: `1px solid ${EMO[res.emotion as Emotion].color}40` }}>
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: EMO[res.emotion as Emotion].color }} />
                {EMO[res.emotion as Emotion].label}
              </span>
              <span className="text-sm font-semibold text-text-secondary tabular-nums">{(res.confidence * 100).toFixed(0)}% confident</span>
            </div>
            <div className="space-y-1.5">
              {ranked.map(({ e, v }) => (
                <div key={e.key} className="grid grid-cols-[88px_1fr_38px] items-center gap-2.5">
                  <span className="text-[11px]" style={{ color: e.color }}>{e.label}</span>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: e.color }}
                      initial={{ width: 0 }} animate={{ width: `${v * 100}%` }} transition={{ duration: 0.5 }} />
                  </div>
                  <span className="text-[11px] tabular-nums text-text-secondary text-right">{(v * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
