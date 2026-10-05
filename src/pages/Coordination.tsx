// ==========================================
// JanDrishti - Coordination Alerts (our headline differentiator)
// Detects clusters of accounts acting in lockstep on a narrative.
// ==========================================
import React from 'react';
import { ShieldAlert, GitBranch, Clock, UserPlus, UserX, ArrowRight } from 'lucide-react';
import { CLUSTER_LABELS } from '../data/sample';
import { useData } from '../store/data.store';
import { Panel } from '../components/shared';
import { InfluenceGraph } from '../components/InfluenceGraph';

const SIGNAL_ICON = [GitBranch, Clock, UserPlus, UserX];
const clusterName = (c: number) => CLUSTER_LABELS[c] ?? `Cluster ${c + 1}`;

const Coordination: React.FC = () => {
  const { coordination: COORDINATION, network: NETWORK, narratives: NARRATIVES } = useData();
  const flagged = NARRATIVES.find(n => n.flagged) ?? NARRATIVES[0];
  const coordNodes = NETWORK.nodes.filter(n => n.coord);
  const coordEdges = NETWORK.edges.filter(e => {
    const s = NETWORK.nodes.find(n => n.id === (e.source as any)); const t = NETWORK.nodes.find(n => n.id === (e.target as any));
    return s?.coord && t?.coord;
  });
  return (
  <div className="animate-fade-in space-y-6 pb-10">
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Coordination alerts</h1>
      <p className="text-sm text-text-secondary mt-1">Flags clusters of accounts amplifying a narrative in lockstep — so coordinated pushes are not mistaken for organic public sentiment.</p>
    </div>

    {/* dark command-center hero */}
    <section className="officer-command-center rounded-2xl border border-slate-700/70 p-5 md:p-6 shadow-2xl">
      <div className="officer-grid absolute inset-0 rounded-2xl opacity-40" aria-hidden="true" />
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300/80">Coordination detected</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{clusterName(COORDINATION.cluster)} · {COORDINATION.accounts} accounts</h2>
            <p className="mt-1 text-xs text-slate-400">Amplifying narrative "{flagged.title}"</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300">
            <span className="officer-pulse h-2 w-2 rounded-full bg-red-300" /> Coordination score {(COORDINATION.score * 100).toFixed(0)}%
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {COORDINATION.signals.map((s, i) => {
            const Icon = SIGNAL_ICON[i];
            return (
              <div key={s.label} className="rounded-xl border border-slate-700/80 bg-slate-950/45 p-3">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/30 bg-red-400/10 text-red-300"><Icon className="h-4 w-4" /></div>
                <p className="text-xs font-semibold text-slate-100">{s.label}</p>
                <p className="mt-1 text-[10px] text-slate-400">{s.detail}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-red-400 transition-all duration-700" style={{ width: `${s.value}%` }} /></div>
                  <span className="text-xs font-bold text-red-300 tabular-nums">{s.value}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
      <Panel title="Coordinated sub-network" tag={`${coordNodes.length} accounts · densely interlinked`}>
        <InfluenceGraph nodes={coordNodes} edges={coordEdges} height={360} showPulses />
      </Panel>

      <div className="space-y-6">
        <Panel title="Why this was flagged" tag="explainable">
          <div className="p-5 space-y-3 text-sm text-text-secondary">
            <p>The cluster shows four independent signatures at once — any one is weak, but together they are a strong coordination signal:</p>
            <ul className="space-y-2">
              {COORDINATION.signals.map(s => (
                <li key={s.label} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#c5453a] flex-shrink-0" /><span><b className="text-text-primary">{s.label}:</b> {s.detail} ({s.value}%).</span></li>
              ))}
            </ul>
            <p className="text-xs text-text-tertiary pt-2 border-t border-border-default">This is a signal for a human analyst, not an automatic takedown. Every flagged post links back to its evidence.</p>
          </div>
        </Panel>

        <button className="w-full card card-hover p-4 flex items-center gap-3 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-blue-50 text-gov-blue"><ShieldAlert className="w-5 h-5" /></span>
          <div><p className="text-sm font-semibold text-text-primary">Discount from organic sentiment</p><p className="text-xs text-text-tertiary">Re-weight the "fare hike" narrative with the coordinated cluster removed.</p></div>
          <ArrowRight className="w-4 h-4 text-text-tertiary ml-auto" />
        </button>
      </div>
    </div>
  </div>
  );
};

export default Coordination;
