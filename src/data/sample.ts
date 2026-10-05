// ==========================================
// JanDrishti - Sample dataset
// One watchlist, 72 hours, generated from a fixed seed so every screen
// agrees with every other screen. Replace with FastAPI responses
// (see src/lib/api.ts) once the serving layer is up.
// Scenario: a city metro line opening - a neutral civic topic.
// ==========================================

export type Platform = 'X' | 'Telegram' | 'Reddit' | 'YouTube' | 'Instagram' | 'Facebook';
export type Emotion = 'supportive' | 'excitement' | 'anxiety' | 'sarcasm' | 'against' | 'neutral';
export type Lang = 'English' | 'Hindi' | 'Hinglish' | 'Marathi' | 'Bengali';

// deterministic PRNG (mulberry32) so the demo is identical on every load
export function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(26152);

export const WATCHLIST = {
  id: 'WL-0417',
  name: 'City Metro Line 3 launch',
  region: 'Mumbai Metropolitan Region',
  query: '#Line3 OR #MetroLine3 OR "metro launch" OR "fare hike" OR मेट्रो',
  createdBy: 'Desk-2 / Analyst',
};

export const EMOTIONS: { key: Emotion; label: string; color: string; soft: string }[] = [
  { key: 'supportive', label: 'Supportive', color: '#3e9862', soft: '#e1f8e7' },
  { key: 'excitement', label: 'Excitement', color: '#2583ee', soft: '#eaf4ff' },
  { key: 'anxiety', label: 'Anxiety', color: '#c2a900', soft: '#fff9cf' },
  { key: 'sarcasm', label: 'Sarcasm', color: '#9b70c4', soft: '#f7f0fc' },
  { key: 'against', label: 'Against', color: '#d95645', soft: '#ffe1d8' },
  { key: 'neutral', label: 'Neutral', color: '#85837a', soft: '#ede4cb' },
];
export const EMO = Object.fromEntries(EMOTIONS.map(e => [e.key, e])) as Record<Emotion, typeof EMOTIONS[number]>;

export const PLATFORMS: { key: Platform; share: number; collector: string; color: string }[] = [
  { key: 'X', share: 0.31, collector: 'X API v2 (Basic tier) + archive', color: '#242b2f' },
  { key: 'Telegram', share: 0.24, collector: 'Telethon · 38 public channels', color: '#2583ee' },
  { key: 'YouTube', share: 0.16, collector: 'YouTube Data API v3 · comments', color: '#d95645' },
  { key: 'Facebook', share: 0.12, collector: 'Graph API · public pages', color: '#5da7f4' },
  { key: 'Reddit', share: 0.1, collector: 'PRAW · 11 subreddits', color: '#e0802c' },
  { key: 'Instagram', share: 0.07, collector: 'Graph API · hashtag search', color: '#9b70c4' },
];

// ---------- time axis: last 72 hours, hourly ----------
export const HOURS = 72;
const now = new Date();
now.setMinutes(0, 0, 0);
export const T0 = now.getTime() - (HOURS - 1) * 3600_000;
export const hourLabel = (i: number) => {
  const d = new Date(T0 + i * 3600_000);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', hour12: false }).replace(',', '');
};
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtAgo = (ts: number) => {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

// The "fare hike" debate spikes at hour ~54 - the anomaly the alert fires on.
export const SPIKE_START = 46;
const bump = (i: number, c: number, w: number) => Math.exp(-((i - c) ** 2) / (2 * w * w));
const diurnal = (i: number) => {
  const h = new Date(T0 + i * 3600_000).getHours();
  return 0.45 + 0.55 * Math.sin(((h - 5) / 24) * Math.PI * 2 - Math.PI / 2) ** 2 * (h > 6 && h < 24 ? 1 : 0.35);
};

export interface HourPoint { i: number; label: string; total: number; [k: string]: number | string }
export const SENTIMENT_SERIES: HourPoint[] = Array.from({ length: HOURS }, (_, i) => {
  const base = 380 + 900 * diurnal(i) + 520 * bump(i, 20, 8);            // launch-day buzz
  const debate = 1500 * bump(i, 54, 6) * (i >= SPIKE_START - 2 ? 1 : 0.2); // fare-hike debate
  const n = (v: number) => Math.round(v * (0.9 + R() * 0.2));
  const p: HourPoint = {
    i, label: hourLabel(i), total: 0,
    supportive: n(base * 0.34 + debate * 0.12),
    excitement: n(base * 0.10 + 180 * bump(i, 22, 3)),                     // first-ride excitement
    anxiety: n(base * 0.18 + debate * 0.16),
    sarcasm: n(base * 0.11 + debate * 0.24),
    against: n(base * 0.11 + debate * 0.34),
    neutral: n(base * 0.16 + debate * 0.14),
  };
  p.total = EMOTIONS.reduce((a, e) => a + (p[e.key] as number), 0);
  return p;
});
export const TOTAL_POSTS = SENTIMENT_SERIES.reduce((a, p) => a + p.total, 0);
export const netSentiment = (p: HourPoint) =>
  Math.round((((p.supportive as number) + (p.excitement as number)) - ((p.against as number) + (p.anxiety as number) * 0.5)) / p.total * 100);

export const EMOTION_TOTALS = EMOTIONS.map(e => ({
  ...e, value: SENTIMENT_SERIES.reduce((a, p) => a + (p[e.key] as number), 0),
}));

export const PLATFORM_SENTIMENT = PLATFORMS.map(pl => {
  const r = rng(pl.key.length * 97 + 3);
  const skew: Record<Platform, Partial<Record<Emotion, number>>> = {
    X: { against: 1.35, sarcasm: 1.4 }, Telegram: { against: 1.4, anxiety: 1.3, supportive: 0.8 },
    YouTube: { supportive: 1.2, excitement: 1.4 }, Facebook: { supportive: 1.3, anxiety: 1.1 },
    Reddit: { sarcasm: 1.6, neutral: 1.3 }, Instagram: { supportive: 1.5, excitement: 1.3, against: 0.6 },
  };
  const row: Record<string, number | string> = { platform: pl.key };
  let sum = 0;
  EMOTION_TOTALS.forEach(e => { const v = e.value * (skew[pl.key][e.key] ?? 1) * (0.9 + r() * 0.2); row[e.key] = v; sum += v; });
  EMOTION_TOTALS.forEach(e => { row[e.key] = Math.round(((row[e.key] as number) / sum) * 1000) / 10; });
  return row;
});

// ---------- narratives (BERTopic clusters) ----------
export interface Narrative {
  id: string; title: string; summary: string; keywords: string[];
  posts: number; accounts: number; momentum: number; burst: number;
  mix: Partial<Record<Emotion, number>>; status: 'rising' | 'peaking' | 'steady' | 'fading';
  flagged?: boolean; firstSeen: number; series: number[]; forecast: number[];
  topPlatforms: Platform[]; languages: Lang[];
}
const nseries = (peak: number, center: number, width: number, floor: number, seed: number) => {
  const r = rng(seed);
  return Array.from({ length: HOURS }, (_, i) => Math.round(floor * diurnal(i) + peak * bump(i, center, width) * (0.85 + r() * 0.3)));
};
const forecast = (s: number[], growth: number) => {
  const last = s.slice(-6).reduce((a, b) => a + b, 0) / 6;
  return Array.from({ length: 12 }, (_, k) => Math.round(last * Math.pow(growth, k + 1)));
};
const mk = (n: Omit<Narrative, 'forecast'> & { g: number }): Narrative => ({ ...n, forecast: forecast(n.series, n.g) });

export const NARRATIVES: Narrative[] = [
  mk({ id: 'N-07', title: 'Fare hike called unfair for daily commuters', summary: 'A cluster of near-identical posts argues the ₹40 fare for an 8 km ride is too steep for daily commuters, several re-using the same phrasing and image. Flagged for a coordination check.',
    keywords: ['fare hike', 'too costly', '₹40', 'daily commute', 'महंगा'], posts: 18420, accounts: 3110, momentum: 312, burst: 6.8,
    mix: { against: 41, sarcasm: 23, anxiety: 16, supportive: 8, neutral: 12 }, status: 'rising', flagged: true, firstSeen: SPIKE_START,
    series: nseries(640, 58, 7, 12, 71), topPlatforms: ['Telegram', 'X', 'Facebook'], languages: ['Hindi', 'Hinglish', 'English'], g: 1.035 }),
  mk({ id: 'N-02', title: 'First-ride experience is world class', summary: 'Appreciation for clean stations, air-conditioning and on-time trains; videos of the first ride on the central stretch drive most shares.',
    keywords: ['first ride', 'world class', 'clean', 'on time', 'proud'], posts: 22960, accounts: 9840, momentum: -8, burst: 1.2,
    mix: { supportive: 58, excitement: 22, neutral: 13, sarcasm: 7 }, status: 'steady', firstSeen: 4,
    series: nseries(420, 22, 12, 160, 72), topPlatforms: ['YouTube', 'Instagram', 'X'], languages: ['English', 'Hindi', 'Marathi'], g: 0.99 }),
  mk({ id: 'N-04', title: 'Peak-hour crowding at interchange', summary: 'First-hand reports of heavy crowding and long queues at the interchange during morning peak; several ask for more coaches.',
    keywords: ['crowded', 'interchange', 'peak hour', 'more coaches', 'भीड़'], posts: 9310, accounts: 4120, momentum: 64, burst: 3.1,
    mix: { anxiety: 46, against: 22, neutral: 18, supportive: 14 }, status: 'rising', firstSeen: 18,
    series: nseries(260, 60, 14, 50, 73), topPlatforms: ['X', 'Facebook', 'Telegram'], languages: ['Hindi', 'Marathi', 'English'], g: 1.02 }),
  mk({ id: 'N-11', title: 'Metro booking app keeps crashing', summary: 'Complaints that the ticketing app crashed during booking on launch day; mostly commuters asking for a fix.',
    keywords: ['app crash', 'booking failed', 'ticket', 'fix the app'], posts: 6140, accounts: 3570, momentum: 22, burst: 1.9,
    mix: { against: 38, sarcasm: 26, anxiety: 20, neutral: 16 }, status: 'peaking', firstSeen: 40,
    series: nseries(220, 49, 9, 20, 74), topPlatforms: ['X', 'Reddit', 'YouTube'], languages: ['Hinglish', 'English', 'Hindi'], g: 1.0 }),
  mk({ id: 'N-05', title: 'Last-mile & feeder connectivity', summary: 'Questions about bus feeders and auto availability at the new stations; useful, mostly informational threads.',
    keywords: ['last mile', 'feeder bus', 'auto', 'connectivity', 'timings'], posts: 7720, accounts: 5210, momentum: -14, burst: 0.8,
    mix: { neutral: 40, anxiety: 28, supportive: 32 }, status: 'steady', firstSeen: 10,
    series: nseries(160, 24, 16, 70, 75), topPlatforms: ['Telegram', 'Facebook', 'X'], languages: ['Marathi', 'English', 'Bengali'], g: 0.98 }),
  mk({ id: 'N-09', title: 'Station art and architecture praised', summary: 'Photos of the mural work and station design shared widely; a positive, civic-pride thread.',
    keywords: ['station art', 'mural', 'architecture', 'design', 'civic pride'], posts: 4880, accounts: 2630, momentum: -31, burst: 0.6,
    mix: { supportive: 62, excitement: 20, neutral: 14, sarcasm: 4 }, status: 'fading', firstSeen: 14,
    series: nseries(210, 20, 10, 25, 76), topPlatforms: ['Instagram', 'X', 'Reddit'], languages: ['English', 'Hindi'], g: 0.95 }),
];

export const NARRATIVE_BY_ID = Object.fromEntries(NARRATIVES.map(n => [n.id, n]));

// ---------- influence network (nodes = accounts, edges = interactions) ----------
export interface Node {
  id: string; handle: string; platform: Platform; cluster: number;
  influence: number; reach: number; dominant: Emotion; kol: boolean; coord?: boolean;
  followers: number; posts: number;
}
export interface Edge { source: string; target: string; weight: number }

const CLUSTERS = ['Commuter groups', 'News & media', 'Civic activists', 'Fan / hype accounts', 'Coordinated cluster'];
export const CLUSTER_LABELS = CLUSTERS;

function buildNetwork() {
  const r = rng(4210);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  // 5 hubs (KOLs), one per cluster
  const hubReach = [412, 268, 190, 331, 96];
  const hubEmotion: Emotion[] = ['supportive', 'neutral', 'against', 'excitement', 'against'];
  for (let c = 0; c < 5; c++) {
    nodes.push({
      id: `h${c}`, handle: `@node_${Math.floor(r() * 0xffff).toString(16).padStart(4, '0')}`, platform: PLATFORMS[c % PLATFORMS.length].key,
      cluster: c, influence: 0.7 + r() * 0.3, reach: hubReach[c] * 1000, dominant: hubEmotion[c],
      kol: true, coord: c === 4, followers: Math.round(hubReach[c] * 1000 * (1.5 + r())), posts: Math.round(40 + r() * 80),
    });
  }
  // satellites
  for (let k = 0; k < 60; k++) {
    const c = Math.floor(r() * 5);
    const coord = c === 4 && r() < 0.8; // the coordinated cluster is mostly synthetic-looking accounts
    nodes.push({
      id: `n${k}`, handle: `@node_${Math.floor(r() * 0xffff).toString(16).padStart(4, '0')}`, platform: PLATFORMS[Math.floor(r() * PLATFORMS.length)].key,
      cluster: c, influence: r() * 0.5, reach: Math.round((2 + r() * 40) * 1000), dominant: EMOTIONS[Math.floor(r() * EMOTIONS.length)].key,
      kol: false, coord, followers: Math.round((coord ? 20 : 200 + r() * 4000)), posts: Math.round(coord ? 60 + r() * 120 : 2 + r() * 30),
    });
  }
  // edges: satellites -> their hub, plus some cross links and hub-hub
  nodes.filter(n => !n.kol).forEach(n => {
    edges.push({ source: n.id, target: `h${n.cluster}`, weight: 1 + Math.round(r() * 3) });
    if (r() < 0.22) edges.push({ source: n.id, target: `h${Math.floor(r() * 5)}`, weight: 1 });
  });
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) if (r() < 0.55) edges.push({ source: `h${a}`, target: `h${b}`, weight: 2 + Math.round(r() * 3) });
  // dense internal links inside the coordinated cluster (the tell-tale signature)
  const coordNodes = nodes.filter(n => n.coord && !n.kol);
  for (let i = 0; i < coordNodes.length; i++) for (let j = i + 1; j < coordNodes.length; j++) if (r() < 0.35) edges.push({ source: coordNodes[i].id, target: coordNodes[j].id, weight: 1 });
  return { nodes, edges };
}
export const NETWORK = buildNetwork();
export const TOP_KOLS = [...NETWORK.nodes].filter(n => n.kol).sort((a, b) => b.reach - a.reach);

// coordination signals for the flagged cluster
export const COORDINATION = {
  cluster: 4,
  accounts: NETWORK.nodes.filter(n => n.coord).length,
  score: 0.82,
  signals: [
    { label: 'Near-identical text', detail: '78% of posts share a 9-gram', value: 78 },
    { label: 'Synchronised timing', detail: 'posts within 90s windows', value: 64 },
    { label: 'Young accounts', detail: 'created in the last 30 days', value: 71 },
    { label: 'Low follower ratio', detail: 'followers-to-following < 0.2', value: 83 },
  ],
};

// ---------- demographics (inferred, aggregate, anonymized) ----------
export const DEMOGRAPHICS = {
  age: [{ label: '18-24', v: 31 }, { label: '25-34', v: 39 }, { label: '35-44', v: 18 }, { label: '45+', v: 12 }],
  region: [{ label: 'Mumbai', v: 44 }, { label: 'Thane', v: 16 }, { label: 'Pune', v: 12 }, { label: 'Navi Mumbai', v: 10 }, { label: 'Other', v: 18 }],
  language: [{ label: 'English', v: 41 }, { label: 'Hindi', v: 29 }, { label: 'Marathi', v: 22 }, { label: 'Other', v: 8 }],
  interests: [{ label: 'Urban transport', v: 52 }, { label: 'Local news', v: 44 }, { label: 'Civic issues', v: 33 }, { label: 'Tech', v: 21 }],
};

// ---------- live feed (streamed on the dashboard) ----------
export interface Post { id: string; handle: string; platform: Platform; emotion: Emotion; lang: Lang; text: string; ts: number; narrative?: string }
const FEED_TEMPLATES: { text: string; emotion: Emotion; lang: Lang; narrative?: string }[] = [
  { text: 'Took the first ride on Line 3 today, the station looks absolutely world class 🚇', emotion: 'supportive', lang: 'English', narrative: 'N-02' },
  { text: 'फिर से किराया बढ़ा दिया? रोज़ सफर करने वालों के लिए ₹40 बहुत ज़्यादा है', emotion: 'against', lang: 'Hindi', narrative: 'N-07' },
  { text: 'wah, ek train jo time pe chalti hai, socha nahi tha ye din dekhenge 😏', emotion: 'sarcasm', lang: 'Hinglish', narrative: 'N-02' },
  { text: 'Interchange was packed at 9am, felt really unsafe in the crowd. Please add more coaches', emotion: 'anxiety', lang: 'English', narrative: 'N-04' },
  { text: 'the booking app crashed twice while paying, fix your backend before charging premium fares', emotion: 'against', lang: 'English', narrative: 'N-11' },
  { text: 'Ridership on day one looks solid, good sign for the whole corridor', emotion: 'supportive', lang: 'English', narrative: 'N-02' },
  { text: 'कोई बताएगा एयरपोर्ट वाले हिस्से से आखिरी ट्रेन कितने बजे है?', emotion: 'neutral', lang: 'Hindi', narrative: 'N-05' },
  { text: '₹40 for 8km daily is steep honestly, monthly pass kab aayega', emotion: 'against', lang: 'Hinglish', narrative: 'N-07' },
  { text: 'The mural work at the central hub is stunning, real civic pride moment', emotion: 'supportive', lang: 'English', narrative: 'N-09' },
  { text: 'सकाळी खूप गर्दी होती, आणखी डबे हवेत', emotion: 'anxiety', lang: 'Marathi', narrative: 'N-04' },
  { text: 'smooth interchange, clear signage, this is how public transit should feel', emotion: 'supportive', lang: 'English', narrative: 'N-02' },
  { text: 'same caption, same photo from 12 accounts in 2 minutes about the fare... organic for sure 🙄', emotion: 'sarcasm', lang: 'English', narrative: 'N-07' },
  { text: 'feeder bus se station tak ka last mile abhi bhi problem hai', emotion: 'neutral', lang: 'Hinglish', narrative: 'N-05' },
  { text: 'Proud of the city today. Waited years for this line and it is finally running', emotion: 'excitement', lang: 'English', narrative: 'N-02' },
];
export function makePost(i: number, ts: number): Post {
  const r = rng(9000 + i);
  const t = FEED_TEMPLATES[i % FEED_TEMPLATES.length];
  return {
    id: `p${i}-${ts}`, handle: `@node_${Math.floor(r() * 0xffff).toString(16).padStart(4, '0')}`,
    platform: PLATFORMS[Math.floor(r() * PLATFORMS.length)].key, emotion: t.emotion, lang: t.lang, text: t.text, ts, narrative: t.narrative,
  };
}
export const SEED_FEED: Post[] = Array.from({ length: 8 }, (_, i) => makePost(i, Date.now() - i * 42_000)).reverse();

// KPI headline figures
export const KPIS = {
  posts24h: SENTIMENT_SERIES.slice(-24).reduce((a, p) => a + p.total, 0),
  netSentiment: netSentiment(SENTIMENT_SERIES[SENTIMENT_SERIES.length - 1]),
  accounts: NETWORK.nodes.length > 0 ? 3812 : 0,
  risingTrends: NARRATIVES.filter(n => n.status === 'rising' || n.status === 'peaking').length,
  platforms: PLATFORMS.length,
  languages: 5,
};
