// ==========================================
// JanDrishti - Sentiment (Component B)
// ==========================================
import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { EMOTIONS, netSentiment } from '../data/sample';
import { useData } from '../store/data.store';
import { Panel, EmotionChip, LiveTag } from '../components/shared';
import { LiveClassifier } from '../components/LiveClassifier';

const Sentiment: React.FC = () => {
  const { sentimentSeries: SENTIMENT_SERIES, emotionTotals: EMOTION_TOTALS, platformSentiment: PLATFORM_SENTIMENT } = useData();
  const latest = SENTIMENT_SERIES[SENTIMENT_SERIES.length - 1];
  return (
  <div className="animate-fade-in space-y-6 pb-10">
    <div>
      <h1 className="text-2xl font-bold text-text-primary">Sentiment & emotion</h1>
      <p className="text-sm text-text-secondary mt-1">Multi-dimensional NLP — supportive, excitement, anxiety, sarcasm, against — tracked hourly. Net sentiment now: <b className="text-text-primary">{netSentiment(latest)}%</b></p>
    </div>

    <LiveClassifier />

    <Panel title="Emotion mix over time" tag="stacked · hourly" right={<LiveTag />}>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={SENTIMENT_SERIES}>
            <defs>{EMOTIONS.map(e => (
              <linearGradient key={e.key} id={`sg-${e.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={e.color} stopOpacity={0.88} /><stop offset="100%" stopColor={e.color} stopOpacity={0.5} />
              </linearGradient>))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ddc6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#85837a' }} tickLine={false} axisLine={false} interval={11} tickFormatter={(l: string) => { const p = l.split(' '); return `${p[0]} ${p[1]} ${p[2]}h`; }} />
            <YAxis tick={{ fontSize: 10, fill: '#85837a' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d4c8aa' }} />
            {EMOTIONS.map(e => <Area key={e.key} type="monotone" dataKey={e.key} name={e.label} stackId="1" stroke={e.color} fill={`url(#sg-${e.key})`} strokeWidth={0.5} isAnimationActive animationDuration={1400} />)}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-3">{EMOTIONS.map(e => <EmotionChip key={e.key} emotion={e.key} small />)}</div>
      </div>
    </Panel>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel title="Overall emotion share" tag="72-hour total">
        <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={EMOTION_TOTALS} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={3} isAnimationActive animationDuration={1400}>
                {EMOTION_TOTALS.map(e => <Cell key={e.key} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => Number(v).toLocaleString('en-IN')} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 w-full sm:w-1/2">
            {EMOTION_TOTALS.map(e => (
              <div key={e.key} className="flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                <span className="text-text-secondary">{e.label}</span>
                <span className="ml-auto font-bold text-text-primary tabular-nums">{e.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Emotion by platform" tag="% of each platform's posts">
        <div className="p-5">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={PLATFORM_SENTIMENT} layout="vertical" stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8ddc6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#85837a' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} />
              <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: '#596064' }} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: any) => `${v}%`} />
              {EMOTIONS.map(e => <Bar key={e.key} dataKey={e.key} name={e.label} stackId="a" fill={e.color} isAnimationActive />)}
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">{EMOTIONS.map(e => <EmotionChip key={e.key} emotion={e.key} small />)}</div>
        </div>
      </Panel>
    </div>
  </div>
  );
};

export default Sentiment;
