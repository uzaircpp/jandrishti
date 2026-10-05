# =============================================================
# JanDrishti - FastAPI serving layer
#
# Serves the computed snapshot (pipeline.py) to the React frontend and
# exposes a LIVE endpoint that runs the trained emotion model on any text.
#   uvicorn app:app --port 8000 --reload
# =============================================================
from __future__ import annotations
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

HERE = Path(__file__).resolve().parent
# load backend/.env so live-collector credentials are available
try:
    from dotenv import load_dotenv
    load_dotenv(HERE / ".env")
except ImportError:
    pass

import emotion_model
import pipeline
import live
app = FastAPI(title="JanDrishti API", version="1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

_snap = None
def snap():
    global _snap
    if _snap is None:
        if pipeline.SNAPSHOT.exists():
            _snap = json.loads(pipeline.SNAPSHOT.read_text(encoding="utf-8"))
        else:
            _snap = pipeline.build_snapshot()
    return _snap

@app.get("/api/health")
def health():
    s = snap()
    return {"ok": True, "corpusSize": s["corpusSize"], "generatedAt": s["generatedAt"],
            "sources": s.get("sources", {})}

@app.get("/api/sources")
def sources():
    """Which live platforms are configured, and what the current snapshot used."""
    s = snap()
    return {"configured": live.sources_status(), "current": s.get("sources", {})}

# ---- snapshot-backed endpoints (shapes match src/data/sample.ts) ----
@app.get("/api/watchlist")
def watchlist(): return snap()["watchlist"]

@app.get("/api/kpis")
def kpis(): return snap()["kpis"]

@app.get("/api/sentiment/series")
def sentiment_series(): return snap()["sentimentSeries"]

@app.get("/api/sentiment/by-platform")
def by_platform(): return snap()["platformSentiment"]

@app.get("/api/sentiment/totals")
def totals(): return snap()["emotionTotals"]

@app.get("/api/narratives")
def narratives(): return snap()["narratives"]

@app.get("/api/network")
def network(): return snap()["network"]

@app.get("/api/network/kols")
def kols(): return snap()["kols"]

@app.get("/api/network/coordination")
def coordination(): return snap()["coordination"]

@app.get("/api/demographics")
def demographics(): return snap()["demographics"]

@app.get("/api/feed")
def feed(): return snap()["feed"]

@app.get("/api/scopes")
def scopes(): return snap().get("scopes", {})

# ---- live model endpoints ----
class Creds(BaseModel):
    username: str
    password: str

# Demo auth for the prototype (NOT production security). Real build swaps this
# for the org SSO / OAuth described in the architecture doc.
_USERS = {
    "analyst": {"password": "sih2026", "name": "Analyst", "role": "Analyst · Desk-2"},
    "admin":   {"password": "sih2026", "name": "Supervisor", "role": "Supervisor · SOC"},
}

@app.post("/api/login")
def login(c: Creds):
    import secrets
    u = _USERS.get(c.username.strip().lower())
    if not u or u["password"] != c.password:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": secrets.token_urlsafe(24),
            "user": {"username": c.username.strip().lower(), "name": u["name"], "role": u["role"]}}

class TextIn(BaseModel):
    text: str

@app.post("/api/classify")
def classify(body: TextIn):
    r = emotion_model.classify([body.text])[0]
    return r

@app.get("/api/model/metrics")
def model_metrics():
    # report the transformer when it's the active backend
    try:
        import emotion_model_hf as hf
        if hf.available():
            i = hf.info()
            return {"backend": "transformer", "name": "CardiffNLP XLM-RoBERTa",
                    "kind": i["kind"], "multilingual": True, "classes": i["classes"]}
    except Exception:
        pass
    if emotion_model.METRICS_PATH.exists():
        d = json.loads(emotion_model.METRICS_PATH.read_text())
        d["backend"] = "tfidf"; d["name"] = "TF-IDF + LogReg"
        return d
    return {"note": "model not trained yet"}

@app.post("/api/refresh")
def refresh(live_mode: bool = True):
    """Rebuild the snapshot. live_mode=true pulls fresh data from the configured
    platforms (Reddit/YouTube/Telegram); if none are configured or collection
    yields nothing, it falls back to the synthetic corpus."""
    global _snap
    built = None
    if live_mode and any(live.sources_status().values()):
        built = live.build_live_snapshot()
    _snap = built or pipeline.build_snapshot()
    return {"ok": True, "corpusSize": _snap["corpusSize"], "sources": _snap.get("sources", {})}

# backwards-compatible alias
@app.post("/api/rebuild")
def rebuild():
    return refresh(live_mode=False)

if __name__ == "__main__":
    import uvicorn
    emotion_model.get_model()
    # fast start: serve the existing snapshot (may already be live). Pull fresh
    # data on demand via POST /api/refresh (keyless YouTube works out of the box).
    snap()
    print("Ready. Configured sources:", live.sources_status())
    uvicorn.run(app, host="127.0.0.1", port=8000)
