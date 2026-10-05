// ==========================================
// JanDrishti - Influence Network (Component E)
// ==========================================
import React, { useState } from 'react';
import { Share2, Crown, Users, TrendingUp } from 'lucide-react';
import { CLUSTER_LABELS, EMO, type Node } from '../data/sample';
import { useData } from '../store/data.store';
import { Panel, EmotionChip } from '../components/shared';
import { InfluenceGraph } from '../components/InfluenceGraph';

const clusterName = (c: number) => CLUSTER_LABELS[c] ?? `Cluster ${c + 1}`;

const Network: React.FC = () => {
  const { network: NETWORK, kols: TOP_KOLS } = useData();
  const [sel, setSel] = useState<Node | null>(null);
  const communities = new Set(NETWORK.nodes.map(n => n.cluster)).size;

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Influence network</h1>
        <p className="text-sm text-text-secondary mt-1">Accounts are nodes, interactions are edges. Larger glowing nodes are key opinion leaders (centrality). Pulses show how sentiment spreads. Click a node to inspect it.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <Panel title="Interaction graph" tag={`${NETWORK.nodes.length} accounts · ${NETWORK.edges.length} links`}>
          <InfluenceGraph nodes={NETWORK.nodes} edges={NETWORK.edges} height={460} onSelect={setSel} selectedId={sel?.id} />
        </Panel>

        <div className="space-y-6">
          {sel ? (
            <Panel title="Account inspector" tag={sel.kol ? 'key opinion leader' : 'account'}>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: EMO[sel.dominant].color }}>{sel.platform[0]}</div>
                  <div><p className="font-mono font-semibold text-text-primary">{sel.handle}</p><p className="text-xs text-text-tertiary">{sel.platform} · {clusterName(sel.cluster)}</p></div>
                  {sel.coord && <span className="ml-auto badge badge-error text-[10px]">coordinated</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['Reach', `${(sel.reach / 1000).toFixed(0)}k`], ['Influence', `${(sel.influence * 100).toFixed(0)}/100`], ['Followers', sel.followers.toLocaleString('en-IN')], ['Posts (72h)', String(sel.posts)]].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-surface-secondary border border-border-default p-3"><p className="text-[10px] uppercase tracking-wide text-text-tertiary">{k}</p><p className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>{v}</p></div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm"><span className="text-text-tertiary">Dominant emotion:</span> <EmotionChip emotion={sel.dominant} small /></div>
              </div>
            </Panel>
          ) : (
            <Panel title="Top influencers (KOLs)" tag="by reach">
              <div>
                {TOP_KOLS.map((k, i) => (
                  <button key={k.id} onClick={() => setSel(k)} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border-default/60 last:border-0 hover:bg-surface-secondary transition">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-saffron-100 text-saffron-800"><Crown className="w-4 h-4" /></span>
                    <div className="min-w-0 flex-1"><p className="font-mono text-sm font-medium text-text-primary">{k.handle}</p><p className="text-[11px] text-text-tertiary">{clusterName(k.cluster)} · {k.platform}</p></div>
                    <span className="text-sm font-bold text-text-primary tabular-nums">{(k.reach / 1000).toFixed(0)}k</span>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Users className="w-4 h-4" />, label: 'Communities', value: communities, accent: '#2583ee', soft: '#eaf4ff' },
              { icon: <Crown className="w-4 h-4" />, label: 'KOLs', value: TOP_KOLS.length, accent: '#c2a900', soft: '#fff9cf' },
              { icon: <Share2 className="w-4 h-4" />, label: 'Links', value: NETWORK.edges.length, accent: '#9b70c4', soft: '#f7f0fc' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="mx-auto mb-2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.soft, color: s.accent }}>{s.icon}</div>
                <p className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p className="text-[10px] uppercase tracking-wide text-text-tertiary">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
