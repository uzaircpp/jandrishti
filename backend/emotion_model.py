# =============================================================
# JanDrishti - Emotion classifier (trained, multilingual)
#
# Six classes: supportive, excitement, anxiety, sarcasm, against, neutral.
# Features: word (1-2gram) + char (3-5gram) TF-IDF, so code-mixed
# Hinglish / Devanagari text classifies without a language detector.
# Model: calibrated LogisticRegression. Trains in seconds on CPU,
# runs offline - ideal for a reproducible demo. `transformers` /
# MuRIL is the documented upgrade path (see README).
# =============================================================
from __future__ import annotations
import json, os, random, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "models" / "emotion_clf.joblib"
METRICS_PATH = HERE / "models" / "emotion_metrics.json"

EMOTIONS = ["supportive", "excitement", "anxiety", "sarcasm", "against", "neutral"]

# ---- labeled seed phrases (English + Hinglish + Hindi + Marathi) ----
SEED: dict[str, list[str]] = {
    "supportive": [
        "this is a great step for the city", "really proud of this project",
        "the new stations look world class and clean", "finally something that works well",
        "well done to the whole team, this helps so many people",
        "bahut accha kaam hua hai, sabko fayda hoga", "yeh to kamaal ka kaam hai, shabaash",
        "मेट्रो से रोज़ का सफर बहुत आसान हो गया है", "यह शहर के लिए बहुत बढ़िया कदम है",
        "छान काम झालं आहे, सगळ्यांना उपयोग होईल", "appreciate the effort, genuinely useful",
        "clean, on time and affordable, exactly what we needed", "huge respect for the people who built this",
        "the service has improved a lot, very happy", "this will help daily commuters so much",
        "supporting this fully, long overdue and well executed", "great initiative, keep it up",
        "ekdum badhiya service hai, maza aa gaya", "सुविधा खूप चांगली आहे, धन्यवाद",
        "solid work, the whole corridor benefits from this", "proud moment for all of us",
        "kudos to the engineers, the stations are spotless and the trains are punctual",
        "the stations are spotless and everything runs punctually, excellent",
        "thank you for this, it makes life so much easier", "brilliant execution, very impressed",
        "hats off, clean trains, on time, helpful staff", "this is exactly what the city deserved",
        "wonderful service, smooth, comfortable and reliable", "fantastic work, truly commendable",
        "staff were helpful and the signage is clear, great job", "best public service upgrade in years",
        "kaafi badiya experience raha, staff bhi helpful tha", "trains saaf hain aur time pe hain, shaandaar",
        "मेट्रो एकदम स्वच्छ आणि वेळेवर, खूप छान", "कर्मचारी मददगार थे, बहुत अच्छा अनुभव",
        "really well run, comfortable and efficient, thumbs up", "love it, reliable and spotless every day",
        "credit where due, they nailed the rollout", "impressed by how smooth and clean it all is",
        "a genuinely useful and well built system, thank you", "superb, punctual and well maintained",
    ],
    "excitement": [
        "cannot wait to try this tomorrow", "so hyped for the launch today",
        "finally it is here, been waiting years for this", "this is amazing i am so excited",
        "first ride today and it was incredible", "omg this is actually happening",
        "itna excited hoon yaar, aaj hi try karunga", "wah bhai, ab to maza aayega",
        "कितना इंतज़ार किया था, आख़िरकार आ गया", "बहुत उत्साहित हूँ, आज ही जाऊँगा",
        "खूप भारी, आजच राइड घेणार", "super thrilled, counting down the hours",
        "this is going to be epic, lets go", "my whole feed is buzzing about this",
        "so pumped for the opening, see you there", "goosebumps watching the first train run",
        "aaj ka din banta hai, chalo chalte hain", "मज्जा येणार आज नक्की",
        "the energy today is unreal, everyone is thrilled", "best news of the year honestly",
    ],
    "anxiety": [
        "i am worried about the crowd during peak hours", "felt really unsafe in the rush today",
        "concerned this will not handle the load", "scared of how packed it gets in the morning",
        "what if the fares keep going up, worried about monthly cost",
        "bahut bheed thi, dar lag raha tha", "tension ho rahi hai itni crowd dekhkar",
        "सुबह बहुत भीड़ थी, असुरक्षित महसूस हुआ", "चिंता है कि किराया और बढ़ेगा",
        "खूप गर्दी होती, काळजी वाटते", "nervous about the safety at interchange",
        "i hope they add more coaches soon, this is unsafe", "really anxious about peak hour crowding",
        "afraid someone will get hurt in that crush", "worried the app failure will cause chaos",
        "darr lagta hai itni bheed mein travel karne se", "काळजी वाटतेय गर्दीमुळे",
        "stressed about whether it can scale to demand", "uneasy about the long queues forming",
        "concerned about last train timings for night shifts",
    ],
    "sarcasm": [
        "wow a train that runs on time, never thought i would see the day",
        "oh great, another fare hike, just what we needed", "sure, totally organic posts, definitely not coordinated",
        "amazing, only took them ten years to build this", "yeah because that will definitely fix everything",
        "waah kya baat hai, bas yahi kami thi", "arre wah, time pe train, miracle ho gaya",
        "क्या बात है, बस यही देखना बाकी था", "वाह, सिर्फ़ दस साल लगे बनाने में",
        "व्वा, वेळेवर ट्रेन, चमत्कारच झाला", "oh fantastic, more price for the same service",
        "congrats on discovering punctuality, world first", "same caption from twelve accounts, so authentic",
        "brilliant, pay premium to stand in a crowd", "love paying more for the privilege of waiting",
        "haan bilkul, sab kuch perfect hai na", "मस्तच, आता सगळं आलबेल आहे म्हणे",
        "genius move raising fares on day one, bravo", "oh sure the app crashing is a feature not a bug",
        "nice, another committee to study the obvious",
    ],
    "against": [
        "the fare hike is unfair for daily commuters", "this is too expensive for regular people",
        "totally against this decision, it hurts the poor", "fix the app before charging premium fares",
        "forty rupees for eight kilometres is daylight robbery", "they never consulted the public on this",
        "kiraya bahut zyada hai, ye galat hai", "itna mehenga? ye to loot hai",
        "यह किराया आम आदमी के लिए बहुत ज़्यादा है", "यह फैसला ग़लत है, विरोध करता हूँ",
        "हे भाडं खूप जास्त आहे, चुकीचं आहे", "strongly oppose this, it is anti commuter",
        "no justification for charging this much", "the pricing is exploitative and must be rolled back",
        "disappointed and angry, this ignores ordinary people", "this policy is a burden on students and workers",
        "bilkul galat, isko wapas lo", "हा निर्णय मागे घ्या, चुकीचा आहे",
        "unacceptable, we demand a reduction in fares", "against this completely, badly planned and unfair",
        "the ticket price is way beyond what a student can afford every day",
        "too costly for daily use, a student simply cannot pay this much",
        "the fare is unaffordable for the average working person", "way too expensive, this prices out the poor",
        "charging this much for a short ride is simply wrong", "the cost is outrageous and nobody can afford it",
        "this is overpriced and unjust, roll it back now", "budget commuters are being pushed out by these fares",
        "itna mehenga ticket, student kaise afford karega roz", "daam itne zyada hain ki aam aadmi travel hi nahi kar sakta",
        "विद्यार्थी रोज़ इतना किराया कैसे देंगे, बहुत महँगा है", "हे तिकीट सामान्य माणसाला परवडणारं नाही",
        "we reject this fare structure, it is anti poor", "the price is a scam, far too high for what it offers",
        "opposing this loudly, ordinary families cannot bear this cost", "shameful pricing, completely unaffordable",
        "they are looting commuters with these rates", "this hike is indefensible and must be reversed",
    ],
    "neutral": [
        "does anyone know the last train timing", "what are the station locations on this line",
        "how do i get a monthly pass", "is there parking available at the station",
        "which gate is closest to the bus stop", "sharing the official route map below",
        "last train kitne baje hai koi bata dega", "monthly pass kaise milega",
        "आख़िरी ट्रेन कितने बजे है कोई बताएगा", "स्टेशन के पास पार्किंग है क्या",
        "शेवटची ट्रेन किती वाजता आहे", "posting the timetable for reference",
        "the line connects the airport to the central hub", "feeder bus details are on the website",
        "here is the fare chart for all stations", "trains run every five minutes during peak",
        "route ki jaankari yahan hai", "वेळापत्रक इथे दिलं आहे",
        "the interchange is at the central station", "operating hours are six am to eleven pm",
        "can someone please share the timings for the airport branch",
        "could anyone share the timings for the airport line please",
        "where can i find the station map", "what time does service start on sundays",
        "how many stations are there on this line", "is the first coach reserved for women",
        "which exit is nearest to the hospital", "do they accept the city travel card here",
        "airport wali line ki timing kahan milegi", "station ke andar lift hai kya koi bataye",
        "रविवार को सेवा कितने बजे शुरू होती है", "या मार्गावर किती स्थानकं आहेत",
        "sharing the official notice about the schedule change", "the frequency is six minutes off peak",
        "attaching the updated route diagram for everyone", "ticket counters are open till ten pm",
        "the new line has twelve stations in total", "parking is available at four of the stations",
        "note: service timings are the same on weekdays", "helpline number is listed on the official site",
    ],
}

# fragments to augment volume while keeping the label signal
_PRE = ["", "", "", "honestly ", "tbh ", "update: ", "folks ", "so ", "fyi ", "update - ",
        "day one: ", "just saw that ", "reading that ", "they say ", "report: "]
_SUF = ["", "", "", " .", " !", " ...", " 🙏", " 🚇", " 😤", " 😏", " 🤷", " #metro",
        " #cityline", " really", " for sure", " tbh", " 😊", " 😬"]

def _augment(text: str, r: random.Random) -> str:
    t = r.choice(_PRE) + text + r.choice(_SUF)
    if r.random() < 0.15:  # light casing noise
        t = t.capitalize()
    return t

def build_dataset(per_class_target: int = 420, seed: int = 26152):
    r = random.Random(seed)
    X, y = [], []
    for emo, phrases in SEED.items():
        seen = set()
        tries = 0
        while sum(1 for v in y if v == emo) < per_class_target and tries < per_class_target * 12:
            tries += 1
            s = _augment(r.choice(phrases), r)
            key = re.sub(r"\s+", " ", s.lower()).strip()
            if key in seen:
                continue
            seen.add(key); X.append(s); y.append(emo)
    return X, y

def _make_pipeline():
    from sklearn.pipeline import Pipeline, FeatureUnion
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    feats = FeatureUnion([
        ("word", TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=1, sublinear_tf=True)),
    ])
    clf = LogisticRegression(C=6.0, max_iter=2000, class_weight="balanced")
    return Pipeline([("feats", feats), ("clf", clf)])

def train(save: bool = True):
    import joblib
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import f1_score, accuracy_score, classification_report
    X, y = build_dataset()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=7, stratify=y)
    pipe = _make_pipeline()
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    metrics = {
        "samples": len(X), "classes": EMOTIONS,
        "accuracy": round(accuracy_score(yte, pred), 4),
        "macro_f1": round(f1_score(yte, pred, average="macro"), 4),
        "report": classification_report(yte, pred, output_dict=True, zero_division=0),
    }
    if save:
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipe, MODEL_PATH)
        METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return pipe, metrics

_model = None
def get_model():
    global _model
    if _model is None:
        import joblib
        if not MODEL_PATH.exists():
            train()
        _model = joblib.load(MODEL_PATH)
    return _model

_HF_MAX = int(os.environ.get("HF_MAX", "2500"))  # use the transformer up to this many texts

def classify(texts):
    """Return list of {emotion, confidence, scores{...}} for each text.
    Prefers the strong multilingual transformer (emotion_model_hf) when it is
    available and the batch is small enough (live data, the interactive demo);
    falls back to the fast TF-IDF model for the large synthetic corpus build."""
    texts = list(texts)
    try:
        import emotion_model_hf as hf
        if hf.available() and 0 < len(texts) <= _HF_MAX:
            return hf.classify(texts)
    except Exception:
        pass  # any transformer issue -> fall back to sklearn
    m = get_model()
    probs = m.predict_proba(texts)
    classes = list(m.classes_)
    out = []
    for row in probs:
        scores = {c: round(float(p), 4) for c, p in zip(classes, row)}
        top = max(scores, key=scores.get)
        out.append({"emotion": top, "confidence": scores[top], "scores": scores})
    return out

if __name__ == "__main__":
    _, m = train()
    print(f"samples={m['samples']}  accuracy={m['accuracy']}  macro_f1={m['macro_f1']}")
    for emo in EMOTIONS:
        rep = m["report"].get(emo, {})
        print(f"  {emo:12s} f1={rep.get('f1-score',0):.3f}  support={int(rep.get('support',0))}")
    # quick smoke test
    tests = ["₹40 for 8km daily is way too much, this is unfair",
             "wah, ek train jo time pe chalti hai, socha nahi tha",
             "cannot wait for the launch tomorrow, so hyped",
             "last train kitne baje hai koi bata dega"]
    for t, r in zip(tests, classify(tests)):
        print(f"  [{r['emotion']:11s} {r['confidence']:.2f}] {t}")
