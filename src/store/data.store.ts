// ==========================================
// JanDrishti - live data store
//
// Loads the analysis snapshot from the FastAPI backend (/api/*) on startup.
// Every screen reads its data from here. If the backend is not running, the
// store keeps the bundled sample dataset so the UI still works - `online`
// tells the header which mode we are in.
// ==========================================
import { create } from 'zustand';
import * as S from '../data/sample';
import type { Narrative, Node as GNode, Edge as GEdge, Post } from '../data/sample';

interface ModelMetrics { accuracy?: number; macro_f1?: number; samples?: number; backend?: string; name?: string; kind?: string; }

interface DataStore {
  online: boolean;
  loaded: boolean;
  corpusSize: number;
  generatedAt: string | null;
  metrics: ModelMetrics | null;

  watchlist: typeof S.WATCHLIST;
  kpis: typeof S.KPIS;
  sentimentSeries: typeof S.SENTIMENT_SERIES;
  emotionTotals: typeof S.EMOTION_TOTALS;
  platformSentiment: typeof S.PLATFORM_SENTIMENT;
  narratives: Narrative[];
  network: { nodes: GNode[]; edges: GEdge[] };
  kols: GNode[];
  coordination: typeof S.COORDINATION;
  demographics: typeof S.DEMOGRAPHICS;
  feed: Post[];

  refreshing: boolean;
  // per-topic focus
  scopes: Record<string, any>;
  globalAgg: any;
  selectedTopic: string;            // 'all' or a topic id
  selectedTopicTitle: string | null;
  setTopic: (id: string) => void;
  loadLive: () => Promise<void>;
  refreshLive: () => Promise<void>;
}

async function j<T>(path: string): Promise<T> {
  const r = await fetch(`/api${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return (await r.json()) as T;
}

export const useData = create<DataStore>((set) => ({
  online: false,
  loaded: false,
  corpusSize: 0,
  generatedAt: null,
  metrics: null,

  watchlist: S.WATCHLIST,
  kpis: S.KPIS,
  sentimentSeries: S.SENTIMENT_SERIES,
  emotionTotals: S.EMOTION_TOTALS,
  platformSentiment: S.PLATFORM_SENTIMENT,
  narratives: S.NARRATIVES,
  network: S.NETWORK,
  kols: S.TOP_KOLS,
  coordination: S.COORDINATION,
  demographics: S.DEMOGRAPHICS,
  feed: S.SEED_FEED,
  refreshing: false,
  scopes: {},
  globalAgg: null,
  selectedTopic: 'all',
  selectedTopicTitle: null,

  setTopic: (id) => {
    const st = useData.getState();
    if (id === 'all' || !st.scopes[id]) {
      const g = st.globalAgg;
      set({ selectedTopic: 'all', selectedTopicTitle: null, ...(g || {}) });
      return;
    }
    const sc = st.scopes[id];
    const title = st.narratives.find(n => n.id === id)?.title ?? null;
    set({
      selectedTopic: id, selectedTopicTitle: title,
      kpis: sc.kpis, sentimentSeries: sc.sentimentSeries, emotionTotals: sc.emotionTotals,
      platformSentiment: sc.platformSentiment, demographics: sc.demographics, feed: sc.feed,
      network: sc.network && sc.network.nodes && sc.network.nodes.length ? sc.network : st.globalAgg?.network,
    });
  },

  loadLive: async () => {
    try {
      const health = await j<{ ok: boolean; corpusSize: number; generatedAt: string }>('/health');
      const [kpis, sentimentSeries, emotionTotals, platformSentiment, narratives,
             network, kols, coordination, demographics, feed, watchlist, metrics] = await Promise.all([
        j<DataStore['kpis']>('/kpis'),
        j<DataStore['sentimentSeries']>('/sentiment/series'),
        j<DataStore['emotionTotals']>('/sentiment/totals'),
        j<DataStore['platformSentiment']>('/sentiment/by-platform'),
        j<Narrative[]>('/narratives'),
        j<DataStore['network']>('/network'),
        j<GNode[]>('/network/kols'),
        j<DataStore['coordination']>('/network/coordination'),
        j<DataStore['demographics']>('/demographics'),
        j<Post[]>('/feed'),
        j<DataStore['watchlist']>('/watchlist'),
        j<ModelMetrics>('/model/metrics').catch(() => null),
      ]);
      const scopes = await j<Record<string, any>>('/scopes').catch(() => ({}));
      const globalAgg = { kpis, sentimentSeries, emotionTotals, platformSentiment, demographics, feed, network };
      set({
        online: true, loaded: true, corpusSize: health.corpusSize, generatedAt: health.generatedAt,
        metrics, kpis, sentimentSeries, emotionTotals, platformSentiment, narratives,
        network, kols, coordination, demographics, feed, watchlist,
        scopes, globalAgg, selectedTopic: 'all', selectedTopicTitle: null,
      });
    } catch {
      // backend down - keep the bundled sample dataset
      set({ online: false, loaded: true });
    }
  },

  refreshLive: async () => {
    set({ refreshing: true });
    try {
      await fetch('/api/refresh?live_mode=true', { method: 'POST' });
    } catch { /* ignore - loadLive below reflects whatever the backend has */ }
    await useData.getState().loadLive();
    set({ refreshing: false });
  },
}));

/** POST a single text to the live model. Throws if backend is down. */
export async function classifyText(text: string) {
  const r = await fetch('/api/classify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`classify ${r.status}`);
  return (await r.json()) as {
    emotion: string; confidence: number; scores: Record<string, number>;
  };
}
