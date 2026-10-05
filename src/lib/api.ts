// ==========================================
// JanDrishti - data access
//
// Every screen imports from here, NOT directly from the sample file, so
// swapping to the real backend is a one-file change. When the FastAPI
// serving layer is running (see the architecture doc), flip USE_API to
// true and point these functions at /api/... - the shapes already match.
// ==========================================
import * as S from '../data/sample';

const USE_API = false; // set true once the FastAPI serving layer is live

async function get<T>(path: string, fallback: T): Promise<T> {
  if (!USE_API) return fallback;
  try {
    const r = await fetch(`/api${path}`);
    if (!r.ok) throw new Error(String(r.status));
    return (await r.json()) as T;
  } catch {
    return fallback; // demo keeps working even if the backend is down
  }
}

export const api = {
  watchlist: () => get('/watchlist', S.WATCHLIST),
  kpis: () => get('/kpis', S.KPIS),
  sentimentSeries: () => get('/sentiment/series', S.SENTIMENT_SERIES),
  platformSentiment: () => get('/sentiment/by-platform', S.PLATFORM_SENTIMENT),
  emotionTotals: () => get('/sentiment/totals', S.EMOTION_TOTALS),
  narratives: () => get('/narratives', S.NARRATIVES),
  network: () => get('/network', S.NETWORK),
  kols: () => get('/network/kols', S.TOP_KOLS),
  coordination: () => get('/network/coordination', S.COORDINATION),
  demographics: () => get('/demographics', S.DEMOGRAPHICS),
  feed: () => get('/feed', S.SEED_FEED),
};
