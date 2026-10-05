# =============================================================
# JanDrishti - transformer emotion backend (strong, multilingual)
#
# Backbone: cardiffnlp/twitter-xlm-roberta-base-sentiment - an XLM-RoBERTa
# model fine-tuned on ~198M multilingual tweets (8 languages incl. Hindi).
# It gives robust positive/neutral/negative on real, messy social text.
# A light multilingual cue layer splits that into our six emotions
# (supportive / excitement / anxiety / sarcasm / against / neutral) so the
# whole app keeps working unchanged - classify() returns the same shape.
# =============================================================
from __future__ import annotations
import os, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
# must be set BEFORE transformers/huggingface_hub are imported anywhere
os.environ.setdefault("HF_HOME", str(HERE / "models" / "hf_cache"))
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
MODEL = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
EMOTIONS = ["supportive", "excitement", "anxiety", "sarcasm", "against", "neutral"]

# multilingual lexical cues (lowercased substring match; English + Hinglish + Devanagari)
_EXCITE = ["excited", "can't wait", "cannot wait", "hyped", "finally", "let's go", "lets go",
           "thrilled", "pumped", "love it", "so good", "best news", "proud", "goosebumps",
           "intezaar", "intzar", "wait kar raha", "maza aa", "maza aayega", "🔥", "🎉", "🥳", "🚀", "❤", "😍",
           "बेसब्री", "उत्साह", "मजा", "खुशी"]
_ANXIETY = ["worried", "worry", "anxious", "scared", "afraid", "unsafe", "fear", "nervous",
            "crowd", "crowded", "overcrowd", "stampede", "danger", "risky", "panic", "stress",
            "tension", "ghabra", "dar ", " darr", "chinta", "chinta ho",
            "डर", "चिंता", "असुरक्षित", "भीड़", "भीड", "गर्दी", "काळजी", "घाबर", "असुरक्षित"]
_SARCASM = ["yeah right", "oh great", "oh wonderful", "sure,", "as if", "classic",
            "genius", "what a joke", "wow,", "great, another", "never thought", "only took",
            "miracle", "congrats on", "socha nahi tha", "kya baat hai", "waah", "wah,", "wah ",
            "वाह", "क्या बात", "😏", "🙄", "🤷", "👏👏"]
_AGAINST = ["too expensive", "overpriced", "unaffordable", "can't afford", "cannot afford",
            "beyond what", "rip off", "ripoff", "scam", "unfair", "unjust", "roll back",
            "oppose", "against this", "protest", "boycott", "loot", "robbery", "exploit",
            "mehenga", "mehnga", "bahut zyada", "महंगा", "महंगाई", "विरोध", "बहिष्कार", "लूट", "गलत"]

def _has(text: str, cues) -> bool:
    t = text.lower()
    return any(c in t for c in cues)

_pipe = None
def _load():
    global _pipe
    if _pipe is not None:
        return _pipe
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
    tok = AutoTokenizer.from_pretrained(MODEL, use_fast=False)
    mod = AutoModelForSequenceClassification.from_pretrained(MODEL)
    _pipe = pipeline("sentiment-analysis", model=mod, tokenizer=tok, top_k=None, truncation=True, max_length=200)
    return _pipe

def available() -> bool:
    """True if transformers + the cached model are usable."""
    try:
        import transformers  # noqa: F401
    except ImportError:
        return False
    snap = HERE / "models" / "hf_cache"
    return snap.exists() and any(snap.rglob("*.safetensors")) or any(snap.rglob("pytorch_model.bin"))

def _map(text: str, pos: float, neu: float, neg: float) -> dict:
    exc, anx, sar, agn = (_has(text, _EXCITE), _has(text, _ANXIETY),
                          _has(text, _SARCASM), _has(text, _AGAINST))
    s = {"supportive": pos, "excitement": pos * 0.12, "anxiety": neg * 0.18,
         "against": neg, "neutral": neu, "sarcasm": 0.03}
    if exc:
        s["excitement"] = pos * 0.85; s["supportive"] = pos * 0.42
    if anx:
        s["anxiety"] = neg * 0.88; s["against"] = neg * 0.55
    if agn:  # explicit opposition / cost complaint the base sentiment may miss
        s["against"] += 0.55 * neu + 0.35 * s["supportive"]
        s["supportive"] *= 0.4; s["neutral"] = neu * 0.5
    if sar:  # surface-positive but not genuine support
        s["sarcasm"] = 0.6 * pos + 0.3 * neu + 0.08
        s["supportive"] *= 0.4; s["neutral"] *= 0.5
    tot = sum(s.values()) or 1.0
    return {k: v / tot for k, v in s.items()}

def classify(texts):
    pipe = _load()
    raw = pipe(list(texts), batch_size=16)
    out = []
    for text, scores in zip(texts, raw):
        d = {r["label"].lower(): r["score"] for r in scores}
        pos = d.get("positive", 0.0); neu = d.get("neutral", 0.0); neg = d.get("negative", 0.0)
        mapped = _map(text or "", pos, neu, neg)
        mapped = {k: round(float(v), 4) for k, v in mapped.items()}
        top = max(mapped, key=mapped.get)
        out.append({"emotion": top, "confidence": mapped[top], "scores": mapped})
    return out

def info():
    return {"model": MODEL, "kind": "XLM-RoBERTa (multilingual, social)",
            "classes": EMOTIONS, "backbone": "sentiment 3-class + cue layer"}

if __name__ == "__main__":
    import json
    tests = ["ticket price is way beyond what a student can pay every day",
             "kudos to the engineers, the stations are spotless and trains are punctual",
             "subah platform pe itni dhakka-mukki thi ki saans lena mushkil tha",
             "wah, ek train jo time pe chalti hai, socha nahi tha ye din dekhenge",
             "cannot wait for the launch tomorrow, so excited",
             "last train kitne baje hai koi bata dega"]
    for t, r in zip(tests, classify(tests)):
        print(f"[{r['emotion']:11s} {r['confidence']:.2f}] {t[:55]}")
