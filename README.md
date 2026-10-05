# JanDrishti — Audience Intelligence (SIH26152)

AI-driven Social Media Analytics Framework for NTRO problem **SIH26152**, by Team
GIT-PUSH-PRAY. This is a working full-stack prototype: a **React** dashboard, a
**FastAPI** backend, and a **trained ML model** whose output drives every figure on
screen — not a static mockup.

```
  React + Vite (5174)  ──/api──▶  FastAPI (8000)  ──▶  trained emotion model
   6 analyst screens                pipeline.py          + TF-IDF topic clustering
                                                         + networkx link analysis
```

## Quick start (Windows)

```bat
setup.bat    :: once — installs deps, trains the model, builds the snapshot
run.bat      :: starts backend + frontend and opens http://localhost:5174
```

### Manual / other OS

```bash
# backend
cd backend
pip install -r requirements.txt
python emotion_model.py     # trains + saves models/emotion_clf.joblib
python pipeline.py          # builds models/snapshot.json from a real 72h corpus
python app.py               # serves http://127.0.0.1:8000

# frontend (new terminal, from repo root)
npm install
npm run dev                 # http://localhost:5174  (proxies /api -> :8000)
```

If the backend is **not** running the UI still works — it falls back to the bundled
sample dataset, and the header shows "Sample data" instead of "Live pipeline".

## What is actually real (the AI)

| Piece | How it works |
|-------|--------------|
| **Emotion model** | `backend/emotion_model.py` — a TF-IDF (word + char n-gram) + LogisticRegression classifier trained on a curated multilingual seed set (English / Hinglish / Devanagari) over 6 classes: supportive, excitement, anxiety, sarcasm, against, neutral. Trains in seconds, runs offline. |
| **Live classification** | The dashboard "Live emotion model" box calls `POST /api/classify` — type any post and watch the model label it in real time. |
| **Sentiment charts** | Computed by running the model over a generated 72-hour, 6-platform corpus (~10k posts) and aggregating by hour / platform. |
| **Narratives (trends)** | Real TF-IDF + KMeans clustering of the corpus, with momentum, burst score and a 12-hour forecast per cluster. |
| **Influence network** | Real `networkx` graph — degree/eigenvector centrality for KOLs, greedy-modularity communities. |
| **Coordination detection** | Real signals over the corpus: near-duplicate text rate, 90-second timing synchrony, young-account share, follower-to-following ratio. **Our headline differentiator.** |
| **Demographics** | Aggregate, anonymized inference from author metadata — never individual-level. |

### Model note (be honest in the pitch)

The classifier scores ~100% on its held-out split because the seed set is template-rich;
on **novel** text it generalises well on five of six emotions. **Sarcasm** is the hard
class (exactly what the PS calls out) and is the one to improve. The documented upgrade
path is fine-tuning a multilingual transformer (MuRIL / XLM-R) on a larger labelled
corpus — the serving interface (`classify()`) stays identical, so no frontend changes.

## Screens → PS components

| Route | Screen | PS component |
|-------|--------|--------------|
| `/` | Overview — KPIs, live classifier, sentiment timeline, live feed, narratives, mini network, coordination alert | A |
| `/sentiment` | Emotion mix over time, overall share, emotion-by-platform, live classifier | **B** |
| `/narratives` | Auto-clustered narratives, momentum, burst, 12-hour forecast | **D** |
| `/network` | Force-directed influence graph, KOLs, account inspector | **E** |
| `/demographics` | Inferred, aggregate, anonymized age/geo/language/interests | **C** |
| `/coordination` | Coordinated-behaviour detection with explainable signals | E + cyber theme |

## Layout

```
backend/
  emotion_model.py   trained classifier (train / classify)
  pipeline.py        corpus generation + model inference + clustering + graph
  app.py             FastAPI serving layer (+ /api/classify, /api/model/metrics)
  requirements.txt
  models/            emotion_clf.joblib, emotion_metrics.json, snapshot.json
src/                 React app (store/data.store.ts loads the live snapshot)
setup.bat / run.bat  one-click Windows scripts
```

## API

`GET /api/health` · `/kpis` · `/sentiment/series` · `/sentiment/by-platform` ·
`/sentiment/totals` · `/narratives` · `/network` · `/network/kols` ·
`/network/coordination` · `/demographics` · `/feed` · `/model/metrics` —
and `POST /api/classify {text}` for the live model, `POST /api/rebuild` to regenerate.

## Design provenance

Design system, tokens and base UI components are shared with the BhumiSetu platform so
the two projects read as one product family (navy sidebar, cream surfaces,
Geist / Inter / Noto Sans Devanagari).

The sample scenario (a city metro-line launch) is synthetic and neutral. The production
path wires these same screens to live collectors (Telethon / PRAW / YouTube) → Kafka →
stores, as described in the architecture document.
