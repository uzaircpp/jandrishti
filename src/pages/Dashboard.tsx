// ==========================================
// JanDrishti - Overview
// ==========================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  MessageSquare, Gauge, Users2, TrendingUp, Globe2, Languages, ArrowUpRight, ArrowDownRight, ShieldAlert, ArrowRight,
} from 'lucide-react';
import { EMOTIONS, PLATFORMS, makePost, type Post, EMO } from '../data/sample';
import { useData } from '../store/data.store';
import { useCountUp, useLiveInterval } from '../hooks/useLiveUpdates';
import { Panel, LiveTag, EmotionChip, statusStyle } from '../components/shared';
import { InfluenceGraph } from '../components/InfluenceGraph';
import { LiveClassifier } from '../components/LiveClassifier';

const KPI: React.FC<{ title: string; value: number; suffix?: string; icon: React.ReactNode; delta?: string; up?: boolean; accent: string; soft: string; spark?: number[] }> =
  ({ title, value, suffix, icon, delta, up, accent, soft, spark }) => {
    const ref = useCountUp(value);
    const data = (spark || []).map((v, i) => ({ i, v }));
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
        className="dashboard-stat-card rounded-xl p-5 border-y border-r border-border-default relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${soft} 0%, #fffdf9 72%, #ffffff 100%)`, borderLeft: `4px solid ${accent}` }}>
        <div className="dashboard-stat-grid" aria-hidden="true" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              <span ref={ref}>0</span>{suffix}
            </h3>
            {delta && <p className={`text-xs mt-1 font-medium inline-flex items-center gap-1 ${up ? 'text-verified' : 'text-error'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{delta}</p>}
          </div>
          <div className="p-2 rounded-lg" style={{ background: soft, color: accent }}>{icon}</div>
        </div>
        {data.length > 0 && (
          <div className="h-9 mt-3 -mx-1 relative z-10 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}><Line type="monotone" dataKey="v" stroke={accent} strokeWidth={2} dot={false} isAnimationActive /></LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    );
  };

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { kpis: KPIS, sentimentSeries: SENTIMENT_SERIES, narratives: NARRATIVES,
          network: NETWORK, coordination: COORDINATION, feed: seedFeed } = useData();
  const spark24 = SENTIMENT_SERIES.slice(-24).map(p => p.total);
  const [feed, setFeed] = useState<Post[]>([]);
  useEffect(() => { setFeed(seedFeed.slice(-12).reverse()); }, [seedFeed]);
  const [n, setN] = useState(1000);
  useLiveInterval(() => { setN(x => x + 1); setFeed(f => [makePost(n, Date.now()), ...f].slice(0, 12)); }, 2600);

  const flagged = NARRATIVES.find(x => x.flagged);

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
          <p className="text-sm text-text-secondary mt-1">One timeline across {PLATFORMS.length} platforms · last 72 hours · {KPIS.languages} languages tracked</p>
        </div>
        <LiveTag label="Live ingest" />
      </div>

      {/* coordination alert */}
      {flagged && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate('/coordination')}
          className="w-full text-left rounded-xl border border-[#e7b0aa] bg-[#fbeae8] px-5 py-3.5 flex items-center gap-3 hover:shadow-card-hover transition">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c5453a]/12 text-[#c5453a]"><ShieldAlert className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">Coordination alert · {COORDINATION.accounts} accounts acting in lockstep</p>
            <p className="text-xs text-text-secondary truncate">Narrative "{flagged.title}" · coordination score {(COORDINATION.score * 100).toFixed(0)}% — review before it is treated as organic sentiment.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#c5453a] ml-auto flex-shrink-0" />
        </motion.button>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI title="Posts (24h)" value={KPIS.posts24h} icon={<MessageSquare className="w-5 h-5" />} delta="12.4% vs prev" up accent="#2583ee" soft="#eaf4ff" spark={spark24} />
        <KPI title="Net sentiment" value={KPIS.netSentiment} suffix="%" icon={<Gauge className="w-5 h-5" />} delta="4 pts, leaning +" up accent="#3e9862" soft="#e1f8e7" />
        <KPI title="Accounts mapped" value={KPIS.accounts} icon={<Users2 className="w-5 h-5" />} delta="218 new nodes" up accent="#9b70c4" soft="#f7f0fc" />
        <KPI title="Rising trends" value={KPIS.risingTrends} icon={<TrendingUp className="w-5 h-5" />} delta="1 turning negative" accent="#c2a900" soft="#fff9cf" />
        <KPI title="Platforms" value={KPIS.platforms} icon={<Globe2 className="w-5 h-5" />} accent="#242b2f" soft="#ede4cb" />
        <KPI title="Languages" value={KPIS.languages} icon={<Languages className="w-5 h-5" />} accent="#d95645" soft="#ffe1d8" />
      </div>

      {/* live model */}
      <LiveClassifier />

      {/* sentiment timeline + live feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <Panel title="Sentiment over time" tag="emotion mix · hourly" right={<LiveTag />}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={SENTIMENT_SERIES}>
                <defs>
                  {EMOTIONS.map(e => (
                    <linearGradient key={e.key} id={`g-${e.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={e.color} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={e.color} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddc6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#85837a' }} tickLine={false} axisLine={false} interval={11} tickFormatter={(l: string) => { const p = l.split(' '); return `${p[0]} ${p[1]} ${p[2]}h`; }} />
                <YAxis tick={{ fontSize: 10, fill: '#85837a' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d4c8aa' }} />
                {EMOTIONS.map(e => (
                  <Area key={e.key} type="monotone" dataKey={e.key} name={e.label} stackId="1" stroke={e.color} fill={`url(#g-${e.key})`} strokeWidth={0.5} isAnimationActive animationDuration={1400} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3">
              {EMOTIONS.map(e => <EmotionChip key={e.key} emotion={e.key} small />)}
            </div>
          </div>
        </Panel>

        <Panel title="Live feed" tag="classified in real time" right={<LiveTag />}>
          <div className="max-h-[340px] overflow-y-auto">
            {feed.map(p => {
              const e = EMO[p.emotion];
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 px-4 py-3 border-b border-border-default/60 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: e.color, color: '#fff' }}>{p.platform[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-text-tertiary">
                      <span className="font-mono font-medium text-text-primary">{p.handle}</span>
                      <span className="px-1.5 py-px rounded border border-border-default">{p.platform}</span>
                      <EmotionChip emotion={p.emotion} small />
                      <span className="text-text-tertiary">{p.lang}</span>
                    </div>
                    <p className="text-[13px] text-text-primary mt-1 leading-snug">{p.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* narratives + network */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-6">
        <Panel title="Top narratives" tag="BERTopic clusters" right={<button onClick={() => navigate('/narratives')} className="text-xs font-semibold text-gov-blue hover:underline inline-flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></button>}>
          <div>
            {NARRATIVES.slice(0, 5).map((nv, i) => {
              const s = statusStyle(nv.status);
              return (
                <button key={nv.id} onClick={() => navigate('/narratives')} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border-default/60 last:border-0 hover:bg-surface-secondary transition">
                  <span className="text-xs font-mono text-text-tertiary w-5">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate flex items-center gap-2">
                      {nv.flagged && <ShieldAlert className="w-3.5 h-3.5 text-[#c5453a] flex-shrink-0" />}{nv.title}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{nv.posts.toLocaleString('en-IN')} posts · {nv.accounts.toLocaleString('en-IN')} accounts</p>
                  </div>
                  <span className={`badge border text-[10px] ${s.cls}`}>{s.label}</span>
                  <span className={`text-xs font-semibold w-12 text-right ${nv.momentum > 0 ? 'text-verified' : 'text-text-tertiary'}`}>{nv.momentum > 0 ? '+' : ''}{nv.momentum}%</span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Influence network" tag="link analysis · centrality" right={<button onClick={() => navigate('/network')} className="text-xs font-semibold text-gov-blue hover:underline inline-flex items-center gap-1">Explore <ArrowRight className="w-3 h-3" /></button>}>
          <InfluenceGraph nodes={NETWORK.nodes} edges={NETWORK.edges} height={300} onSelect={() => navigate('/network')} />
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;
