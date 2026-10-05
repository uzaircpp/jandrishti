// ==========================================
// JanDrishti - geographic projection
//
// Projects the national emotion mix (the live model's output) onto Indian states
// using per-region leanings, so the map stays consistent with every other screen.
// State geometry comes from india-states.geo.json (real boundaries, 36 states/UTs).
// ==========================================
import { EMOTIONS, type Emotion } from './sample';

export type Region = 'N' | 'S' | 'E' | 'W' | 'C' | 'NE';
export const REGION_NAME: Record<Region, string> = { N: 'North', S: 'South', E: 'East', W: 'West', C: 'Central', NE: 'Northeast' };

// keyed by the exact st_nm in india-states.geo.json
export const STATE_META: Record<string, { region: Region; vol: number }> = {
  'Andaman and Nicobar Islands': { region: 'S', vol: 1 },
  'Andhra Pradesh': { region: 'S', vol: 5 },
  'Arunachal Pradesh': { region: 'NE', vol: 1 },
  'Assam': { region: 'NE', vol: 3 },
  'Bihar': { region: 'E', vol: 7 },
  'Chandigarh': { region: 'N', vol: 1 },
  'Chhattisgarh': { region: 'C', vol: 3 },
  'Dadra and Nagar Haveli and Daman and Diu': { region: 'W', vol: 1 },
  'Delhi': { region: 'N', vol: 5 },
  'Goa': { region: 'W', vol: 1 },
  'Gujarat': { region: 'W', vol: 5 },
  'Haryana': { region: 'N', vol: 3 },
  'Himachal Pradesh': { region: 'N', vol: 1 },
  'Jammu and Kashmir': { region: 'N', vol: 2 },
  'Jharkhand': { region: 'E', vol: 4 },
  'Karnataka': { region: 'S', vol: 6 },
  'Kerala': { region: 'S', vol: 4 },
  'Ladakh': { region: 'N', vol: 1 },
  'Lakshadweep': { region: 'S', vol: 1 },
  'Madhya Pradesh': { region: 'C', vol: 5 },
  'Maharashtra': { region: 'W', vol: 10 },
  'Manipur': { region: 'NE', vol: 1 },
  'Meghalaya': { region: 'NE', vol: 1 },
  'Mizoram': { region: 'NE', vol: 1 },
  'Nagaland': { region: 'NE', vol: 1 },
  'Odisha': { region: 'E', vol: 4 },
  'Puducherry': { region: 'S', vol: 1 },
  'Punjab': { region: 'N', vol: 3 },
  'Rajasthan': { region: 'W', vol: 5 },
  'Sikkim': { region: 'NE', vol: 1 },
  'Tamil Nadu': { region: 'S', vol: 6 },
  'Telangana': { region: 'S', vol: 4 },
  'Tripura': { region: 'NE', vol: 1 },
  'Uttar Pradesh': { region: 'N', vol: 10 },
  'Uttarakhand': { region: 'N', vol: 2 },
  'West Bengal': { region: 'E', vol: 7 },
};

// how each region leans, relative to the national mix (multiplicative, renormalized)
const REGION_LEAN: Record<Region, Partial<Record<Emotion, number>>> = {
  W:  { against: 1.25, anxiety: 1.2, excitement: 1.15, neutral: 0.85 }, // home of the topic - most engaged
  N:  { supportive: 1.2, neutral: 1.15, sarcasm: 0.9 },
  S:  { sarcasm: 1.3, against: 1.1, neutral: 1.05, excitement: 0.9 },
  E:  { anxiety: 1.25, against: 1.1, neutral: 1.05 },
  C:  { supportive: 1.15, neutral: 1.2, against: 0.9 },
  NE: { excitement: 1.2, neutral: 1.25, against: 0.8 },
};
const REGION_ENGAGE: Record<Region, number> = { W: 1.0, N: 0.55, S: 0.5, E: 0.5, C: 0.45, NE: 0.35 };

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }

export interface StateEmotion {
  name: string; region: Region;
  mix: Record<Emotion, number>;   // shares 0..1
  dominant: Emotion;
  volume: number;
}

/** Build per-state emotion mix from national emotion totals (the model's output). */
export function buildGeography(emotionTotals: { key: Emotion; value: number }[], grandTotal: number): Record<string, StateEmotion> {
  const natTotal = emotionTotals.reduce((a, e) => a + e.value, 0) || 1;
  const natShare: Record<string, number> = {};
  emotionTotals.forEach(e => { natShare[e.key] = e.value / natTotal; });

  const out: Record<string, StateEmotion> = {};
  for (const [name, meta] of Object.entries(STATE_META)) {
    const lean = REGION_LEAN[meta.region];
    const raw: Record<string, number> = {}; let sum = 0;
    EMOTIONS.forEach(e => {
      const jitter = 0.9 + hash(name + e.key) * 0.2;
      const v = (natShare[e.key] ?? 0) * (lean[e.key] ?? 1) * jitter;
      raw[e.key] = v; sum += v;
    });
    const mix = {} as Record<Emotion, number>;
    EMOTIONS.forEach(e => { mix[e.key] = raw[e.key] / (sum || 1); });
    let dominant = EMOTIONS[0].key;
    EMOTIONS.forEach(e => { if (mix[e.key] > mix[dominant]) dominant = e.key; });
    const volume = Math.round((grandTotal / 40) * meta.vol * REGION_ENGAGE[meta.region] * (0.8 + hash(name + 'v') * 0.5));
    out[name] = { name, region: meta.region, mix, dominant, volume };
  }
  return out;
}

// sequential ramp from a pale tint to the emotion hue to a darker shade
export function rampColor(hex: string, lo: string, t: number): string {
  const H = (h: string) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const col = H(hex), loc = H(lo), dark = mix(col, [0, 0, 0], 0.18);
  const rgb = t < 0.5 ? mix(loc, col, t / 0.5) : mix(col, dark, (t - 0.5) / 0.5);
  return `rgb(${rgb.join(',')})`;
}
