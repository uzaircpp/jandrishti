// ==========================================
// JanDrishti - Demographics (Component C)
// Inferred, aggregate, anonymized. Never individual-level.
// ==========================================
import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useData } from '../store/data.store';
import { Panel, Meter } from '../components/shared';

const GROUPS: { key: 'age' | 'region' | 'language' | 'interests'; title: string; color: string }[] = [
  { key: 'age', title: 'Age bracket', color: '#2583ee' },
  { key: 'region', title: 'Geographic distribution', color: '#3e9862' },
  { key: 'language', title: 'Language', color: '#9b70c4' },
  { key: 'interests', title: 'Professional interests', color: '#c2a900' },
];

const Demographics: React.FC = () => {
  const DEMOGRAPHICS = useData(s => s.demographics);
  const online = useData(s => s.online);
  // what's genuinely derivable per source: language is detected from post text;
  // age/region/interests need profile/bio signals (X, Reddit) — on a comment-only
  // source like YouTube they are illustrative, not measured.
  const basis = (key: string): { label: string; cls: string } => {
    if (key === 'language') return { label: 'detected from text', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (online) return { label: 'illustrative — needs profile data', cls: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'modelled estimate', cls: 'text-blue-700 bg-blue-50 border-blue-200' };
  };
  return (
  <div className="animate-fade-in space-y-6 pb-10">
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Audience demographics</h1>
      <p className="text-sm text-text-secondary mt-1">Aggregate, anonymized estimates. <b>Language</b> is detected from post text; age, region and interests are inferred from profile signals where a source exposes them.</p>
    </div>

    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 flex items-start gap-3">
      <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-emerald-900">Privacy by design</p>
        <p className="text-xs text-emerald-800 mt-0.5">All figures are aggregate percentages with model confidence. Handles are anonymized (<code className="font-mono">@node_id</code>). No individual is profiled, stored or displayed.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {GROUPS.map(g => (
        <Panel key={g.key} title={g.title} tag={<span className={`badge border text-[10px] ${basis(g.key).cls}`}>{basis(g.key).label}</span>}>
          <div className="p-5 space-y-3">
            {DEMOGRAPHICS[g.key].map(row => (
              <div key={row.label} className="grid grid-cols-[110px_1fr_44px] items-center gap-3">
                <span className="text-sm text-text-primary">{row.label}</span>
                <Meter value={row.v} color={g.color} />
                <span className="text-sm font-semibold text-text-secondary tabular-nums text-right">{row.v}%</span>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>

    <div className="flex items-start gap-2 text-xs text-text-tertiary">
      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <p>Demographic inference is probabilistic. <b>On comment-only sources like YouTube, age/region are illustrative</b> because the platform exposes no profile data — real inference uses bio/behaviour signals from sources such as X or Reddit. Language here is genuinely detected from the post text.</p>
    </div>
  </div>
  );
};

export default Demographics;
