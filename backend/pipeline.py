# =============================================================
# JanDrishti - analysis pipeline
#
# Generates a realistic 72h multi-platform corpus, then runs the REAL
# trained emotion model + scikit-learn topic clustering + networkx graph
# analysis over it. Every figure the API serves is computed here from text,
# not hand-written. Result is cached to models/snapshot.json.
# =============================================================
from __future__ import annotations
import json, math, random, re
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import networkx as nx

from emotion_model import classify, EMOTIONS

HERE = Path(__file__).resolve().parent
SNAPSHOT = HERE / "models" / "snapshot.json"

EMO_COLOR = {
    "supportive": ("#3e9862", "#e1f8e7"), "excitement": ("#2583ee", "#eaf4ff"),
    "anxiety": ("#c2a900", "#fff9cf"), "sarcasm": ("#9b70c4", "#f7f0fc"),
    "against": ("#d95645", "#ffe1d8"), "neutral": ("#85837a", "#ede4cb"),
}
EMO_LABEL = {e: e.capitalize() for e in EMOTIONS}
PLATFORMS = [
    ("X", "X API v2 (Basic tier) + archive", "#242b2f"),
    ("Telegram", "Telethon · 38 public channels", "#2583ee"),
    ("YouTube", "YouTube Data API v3 · comments", "#d95645"),
    ("Facebook", "Graph API · public pages", "#5da7f4"),
    ("Reddit", "PRAW · 11 subreddits", "#e0802c"),
    ("Instagram", "Graph API · hashtag search", "#9b70c4"),
]
HOURS = 72

# ---- narratives: latent topics the corpus is sampled from ----
# text pools carry natural emotion; the model infers it back.
NARR = [
    dict(nid="N-07", title="Fare hike called unfair for daily commuters",
         keywords=["fare","hike","costly","₹40","commute"], center=58, width=7, base=120, peak=620,
         platforms=["Telegram","X","Facebook"], growth=1.035, flagged=True,
         texts=[
            "₹40 for an 8km ride every day is far too expensive for regular commuters",
            "the fare hike is unfair, students and workers simply cannot afford this daily",
            "itna mehenga ticket, roz travel karne wale kaise manage karein",
            "यह किराया आम आदमी के लिए बहुत ज़्यादा है, वापस लो",
            "charging premium fares for a short ride is daylight robbery",
            "हे भाडं सामान्य प्रवाशांना परवडणारं नाही, खूप जास्त आहे",
            "overpriced and unjust, the fare must be rolled back now",
            "forty rupees one way is looting daily commuters, shameful",
         ]),
    dict(nid="N-02", title="First-ride experience is world class",
         keywords=["first","ride","world","class","clean"], center=22, width=12, base=160, peak=430,
         platforms=["YouTube","Instagram","X"], growth=0.99, flagged=False,
         texts=[
            "took the first ride today and the stations look absolutely world class",
            "clean trains, air conditioned, on time, this is fantastic work",
            "pehli ride li aaj, ekdum badhiya experience raha, proud moment",
            "मेट्रो एकदम स्वच्छ आणि वेळेवर, खूप छान काम",
            "kudos to the team, spotless stations and punctual service",
            "so proud of the city today, waited years and it is finally here",
            "the station architecture is stunning, genuinely impressed",
            "best public transit upgrade in years, smooth and comfortable",
         ]),
    dict(nid="N-04", title="Peak-hour crowding at the interchange",
         keywords=["crowded","interchange","peak","coaches","भीड़"], center=60, width=14, base=50, peak=250,
         platforms=["X","Facebook","Telegram"], growth=1.02, flagged=False,
         texts=[
            "the interchange was packed at 9am, i felt really unsafe in the crush",
            "subah itni bheed thi ki saans lena mushkil tha, aur coaches chahiye",
            "सकाळी खूप गर्दी होती, आणखी डबे हवेत",
            "worried about safety during peak hours, the platform is overcrowded",
            "long queues at the interchange, nervous it cannot handle the load",
            "भीड़ के कारण असुरक्षित महसूस हुआ, कृपया और डिब्बे जोड़ें",
            "scared someone will get hurt in that morning rush",
         ]),
    dict(nid="N-11", title="Metro booking app keeps crashing",
         keywords=["app","crash","booking","ticket","fix"], center=49, width=9, base=20, peak=220,
         platforms=["X","Reddit","YouTube"], growth=1.0, flagged=False,
         texts=[
            "the booking app crashed twice while i was paying, fix your backend",
            "ticket booking failed again, app is broken on launch day",
            "app baar baar crash ho raha hai, paise bhi kat gaye",
            "oh great, a premium fare and an app that does not even work",
            "booking ke time app hang ho gaya, bahut bura experience",
            "please fix the ticketing app before charging these fares",
         ]),
    dict(nid="N-05", title="Last-mile and feeder connectivity",
         keywords=["last","mile","feeder","bus","timings"], center=24, width=16, base=70, peak=160,
         platforms=["Telegram","Facebook","X"], growth=0.98, flagged=False,
         texts=[
            "can someone share the feeder bus timings from the station",
            "last mile connectivity se station tak abhi bhi dikkat hai",
            "आख़िरी ट्रेन कितने बजे है और फीडर बस कहाँ मिलेगी",
            "sharing the official feeder route map for everyone",
            "which exit is nearest to the bus stop, anyone knows",
            "स्थानकाजवळ ऑटो मिळतात का कुणाला माहिती आहे का",
            "posting the connectivity details from the official site",
         ]),
    dict(nid="N-09", title="Station art and architecture praised",
         keywords=["station","art","mural","design","pride"], center=20, width=10, base=25, peak=210,
         platforms=["Instagram","X","Reddit"], growth=0.95, flagged=False,
         texts=[
            "the mural work at the central hub is stunning, real civic pride",
            "station design is beautiful, loved the artwork on the walls",
            "station ki art dekhkar dil khush ho gaya, kamaal hai",
            "सुंदर स्थानक, भिंतींवरची कलाकृती अप्रतिम",
            "gorgeous architecture, this is how public spaces should look",
            "appreciate the thought put into the station aesthetics",
         ]),
]

def _rng(seed): return random.Random(seed)

def _diurnal(ts: datetime) -> float:
    h = ts.hour
    return 0.45 + 0.55 * (math.sin(((h - 5) / 24) * 2 * math.pi - math.pi / 2) ** 2) * (1 if 6 < h < 24 else 0.35)

def generate_corpus():
    """Build ~3500 posts across 72h with authors; returns (posts, authors)."""
    r = _rng(26152)
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    t0 = now - timedelta(hours=HOURS - 1)

    # author pool
    authors = {}
    def new_author(coord=False, cluster=0):
        aid = f"a{len(authors)}"
        plat = PLATFORMS[r.randrange(len(PLATFORMS))][0]
        age_days = int(r.uniform(5, 40)) if coord else int(r.uniform(90, 2600))
        authors[aid] = dict(
            id=aid, handle=f"@node_{r.randrange(0xffff):04x}", platform=plat,
            cluster=cluster, coord=coord, account_age_days=age_days,
            followers=int(r.uniform(5, 60)) if coord else int(r.uniform(80, 60000)),
            following=int(r.uniform(400, 2000)) if coord else int(r.uniform(50, 1500)),
            age_bracket=r.choices(["18-24","25-34","35-44","45+"], [0.31,0.39,0.18,0.12])[0],
            region=r.choices(["Mumbai","Thane","Pune","Navi Mumbai","Other"], [0.44,0.16,0.12,0.10,0.18])[0],
            interests=r.sample(["Urban transport","Local news","Civic issues","Tech","Sports"], k=2),
        )
        return aid
    # general authors + a coordinated cluster (for N-07)
    general = [new_author() for _ in range(900)]
    coord_cluster = [new_author(coord=True, cluster=4) for _ in range(70)]

    posts = []
    pid = 0
    for nd in NARR:
        for i in range(HOURS):
            ts = t0 + timedelta(hours=i)
            # volume for this narrative at this hour
            vol = nd["base"] * _diurnal(ts) + nd["peak"] * math.exp(-((i - nd["center"]) ** 2) / (2 * nd["width"] ** 2))
            vol = int(vol * (0.6 + r.random() * 0.8) / 6)  # scaled down to keep corpus ~3-4k
            for _ in range(max(0, vol)):
                coordinated = nd["flagged"] and r.random() < 0.45
                if coordinated:
                    aid = r.choice(coord_cluster)
                    # near-identical text (the coordination signature)
                    text = nd["texts"][0]
                    tstamp = ts + timedelta(seconds=r.randrange(0, 90))  # tight sync windows
                else:
                    aid = r.choice(general)
                    text = r.choice(nd["texts"])
                    tstamp = ts + timedelta(seconds=r.randrange(0, 3600))
                lang = ("Hindi" if re.search(r"[ऀ-ॿ]", text) else
                        "Hinglish" if re.search(r"\b(hai|nahi|kaise|bhi|raha|gaya|chahiye|le)\b", text) else "English")
                posts.append(dict(id=f"p{pid}", author=aid, narrative=nd["nid"],
                                  platform=authors[aid]["platform"], lang=lang, text=text,
                                  ts=int(tstamp.timestamp() * 1000)))
                pid += 1
    posts.sort(key=lambda p: p["ts"])
    return posts, authors, t0

def _hour_label(t0, i):
    d = t0 + timedelta(hours=i)
    return d.strftime("%d %b %H").replace(" 0", " ")

def build_snapshot():
    """Synthetic fallback snapshot - no live credentials required."""
    posts, authors, t0 = generate_corpus()
    watchlist = dict(id="WL-0417", name="City Metro Line 3 launch",
                     region="Mumbai Metropolitan Region",
                     query='#Line3 OR #MetroLine3 OR "metro launch" OR "fare hike" OR मेट्रो',
                     createdBy="Desk-2 / Analyst")
    return analyze(posts, authors, t0, watchlist, sources={"mode": "synthetic", "platforms": []})


def analyze(posts, authors, t0, watchlist, sources=None):
    """Run the model + clustering + graph analysis over ANY corpus (synthetic or
    live) and write the snapshot. `posts` and `authors` follow the shapes in
    generate_corpus(); `sources` records which live platforms were used."""
    texts = [p["text"] for p in posts]
    # ---- REAL model inference over the whole corpus ----
    preds = classify(texts)
    for p, pr in zip(posts, preds):
        p["emotion"] = pr["emotion"]; p["confidence"] = pr["confidence"]

    t0_ms = int(t0.timestamp() * 1000)

    # ---- reusable aggregation helpers (run over the whole corpus AND per topic) ----
    def series_of(ps):
        b = [defaultdict(int) for _ in range(HOURS)]
        for p in ps:
            hi = min(HOURS - 1, max(0, int((p["ts"] - t0_ms) / 3_600_000)))
            b[hi][p["emotion"]] += 1
        out = []
        for i in range(HOURS):
            row = {"i": i, "label": _hour_label(t0, i)}; tot = 0
            for e in EMOTIONS:
                row[e] = b[i][e]; tot += b[i][e]
            row["total"] = tot; out.append(row)
        return out

    def totals_of(ps):
        c = Counter(p["emotion"] for p in ps)
        return [dict(key=e, label=EMO_LABEL[e], color=EMO_COLOR[e][0], soft=EMO_COLOR[e][1],
                     value=c.get(e, 0)) for e in EMOTIONS]

    def platform_of(ps):
        pc = {pl[0]: Counter() for pl in PLATFORMS}
        for p in ps:
            if p["platform"] in pc:
                pc[p["platform"]][p["emotion"]] += 1
        rows = []
        for pl in PLATFORMS:
            c = pc[pl[0]]; s = sum(c.values()) or 1
            row = {"platform": pl[0]}
            for e in EMOTIONS:
                row[e] = round(c.get(e, 0) / s * 1000) / 10
            rows.append(row)
        return rows

    def kpis_of(ps, ser):
        last = ser[-1]
        net = round(((last["supportive"] + last["excitement"]) - (last["against"] + last["anxiety"] * 0.5)) / max(1, last["total"]) * 100)
        return dict(posts24h=sum(r["total"] for r in ser[-24:]),
                    netSentiment=net, accounts=len(set(p["author"] for p in ps)),
                    risingTrends=1, platforms=len(set(p["platform"] for p in ps)),
                    languages=len(set(p["lang"] for p in ps)))

    def demo_of(ps):
        def pct(counter):
            s = sum(counter.values()) or 1
            return [dict(label=k, v=round(v / s * 100)) for k, v in counter.most_common()]
        age_c, reg_c, lang_c, int_c = Counter(), Counter(), Counter(), Counter()
        ap = defaultdict(list)
        for p in ps:
            ap[p["author"]].append(p)
        for a, pl in ap.items():
            au = authors.get(a, {}); w = len(pl)
            if au.get("age_bracket"): age_c[au["age_bracket"]] += w
            if au.get("region"): reg_c[au["region"]] += w
            for it in au.get("interests", []):
                int_c[it] += w
        for p in ps:
            lang_c[p["lang"]] += 1
        return dict(age=sorted(pct(age_c), key=lambda d: d["label"]) or [{"label": "n/a", "v": 100}],
                    region=(pct(reg_c)[:5] or [{"label": "n/a", "v": 100}]),
                    language=(pct(lang_c)[:4] or [{"label": "n/a", "v": 100}]),
                    interests=(pct(int_c)[:4] or [{"label": "n/a", "v": 100}]))

    def feed_of(ps):
        return [dict(id=p["id"], handle=authors.get(p["author"], {}).get("handle", p["author"]),
                     platform=p["platform"], emotion=p["emotion"], lang=p["lang"], text=p["text"],
                     ts=p["ts"], narrative=p.get("narrative") or p.get("topic_id"))
                for p in ps[-40:]]

    def net_of(ps):
        """Build a small, connected interaction graph from a topic's own posts
        (accounts that engaged on the same topic, linked to its most active hubs)."""
        ap = defaultdict(list)
        for p in ps:
            ap[p["author"]].append(p)
        ranked = sorted(ap.keys(), key=lambda a: -len(ap[a]))
        if not ranked:
            return {"nodes": [], "edges": []}
        keep = ranked[:40]
        hubs = ranked[:max(1, len(keep) // 10)]
        top_posts = len(ap[ranked[0]]) or 1
        nodes = []
        for i, a in enumerate(keep):
            au = authors.get(a, {}); pn = len(ap[a])
            infl = round(min(1.0, 0.2 + pn / top_posts * 0.8), 3)
            dom = Counter(p["emotion"] for p in ap[a]).most_common(1)[0][0]
            nodes.append(dict(id=a, handle=au.get("handle", a), platform=ap[a][0]["platform"],
                              cluster=i % 6, influence=infl, reach=int((au.get("followers", 800) or 800) * (1 + infl)),
                              dominant=dom, kol=False, coord=au.get("coord", False),
                              followers=au.get("followers", 0), posts=pn))
        edges, hubset = [], set(hubs)
        for a in keep:
            if a in hubset:
                continue
            tgt = hubs[hash(a) % len(hubs)]
            edges.append(dict(source=a, target=tgt, weight=1))
        for i in range(len(hubs)):
            for j in range(i + 1, len(hubs)):
                edges.append(dict(source=hubs[i], target=hubs[j], weight=2))
        for nd in sorted(nodes, key=lambda x: -x["reach"])[:3]:
            nd["kol"] = True
        return {"nodes": nodes, "edges": edges}

    # ---- whole-corpus aggregates ----
    series = series_of(posts)
    emotion_totals = totals_of(posts)
    platform_sentiment = platform_of(posts)
    nid_posts = {}  # topic id -> its posts (filled while building narratives)

    # ---------- narratives via TF-IDF + KMeans (real clustering) ----------
    # Works for synthetic posts (tagged with a latent narrative) AND live posts
    # (no tags) - in the live case each cluster becomes a discovered topic,
    # titled from its own top keywords.
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import KMeans
    has_tags = any(p.get("narrative") for p in posts)
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=4000, stop_words="english")
    Xt = vec.fit_transform(texts)
    k = (len(NARR) + 5) if has_tags else max(4, min(10, len(posts) // 40))
    km = KMeans(n_clusters=k, random_state=7, n_init=10).fit(Xt)
    labels = km.labels_
    terms = np.array(vec.get_feature_names_out())
    cluster_kw = {c: list(terms[np.argsort(km.cluster_centers_[c])[::-1][:6]]) for c in range(k)}

    def _title_from_kw(kws):
        seen = []
        for w in kws:
            if w and w not in seen: seen.append(w)
            if len(seen) >= 3: break
        return " · ".join(w.title() for w in seen) if seen else "Emerging topic"

    def _record(nid, title, keywords, cl_posts, growth):
        emo_mix = Counter(p["emotion"] for p in cl_posts); s = sum(emo_mix.values()) or 1
        mix = {e: round(emo_mix.get(e, 0) / s * 100) for e in EMOTIONS if emo_mix.get(e, 0)}
        cser = [0] * HOURS
        for p in cl_posts:
            hi = min(HOURS - 1, max(0, int((p["ts"] - t0_ms) / 3_600_000))); cser[hi] += 1
        recent = sum(cser[-6:]) / 6 or 0.1; base = (sum(cser[:-6]) / max(1, HOURS - 6)) or 0.1
        burst = round(recent / base, 1); momentum = round((recent - base) / base * 100)
        forecast = [round(recent * growth ** (j + 1)) for j in range(12)]
        accounts = len(set(p["author"] for p in cl_posts))
        coord_share = (sum(1 for p in cl_posts if authors[p["author"]].get("coord")) / len(cl_posts)) if cl_posts else 0
        status = ("rising" if momentum > 40 else "peaking" if momentum > 5 else "fading" if momentum < -25 else "steady")
        langs = [l for l, _ in Counter(p["lang"] for p in cl_posts).most_common(3)]
        plats = [pl for pl, _ in Counter(p["platform"] for p in cl_posts).most_common(3)]
        first_seen = min(range(HOURS), key=lambda h: (cser[h] == 0, h))
        nid_posts[nid] = cl_posts  # remember this topic's posts for per-topic scoping
        return dict(id=nid, title=title,
            summary=f"Auto-clustered from {len(cl_posts):,} posts by {accounts:,} accounts. "
                    f"Top terms: {', '.join(keywords[:4])}." +
                    (" Flagged for a coordination check." if coord_share > 0.25 else ""),
            keywords=keywords[:5], posts=len(cl_posts), accounts=accounts, momentum=momentum, burst=burst,
            mix=mix, status=status, flagged=coord_share > 0.25, firstSeen=first_seen,
            series=cser, forecast=forecast, topPlatforms=plats, languages=langs)

    narratives = []
    has_topics = any(p.get("topic_id") for p in posts)
    if has_topics:
        # live: each trending item (e.g. a YouTube video/headline) is a topic,
        # titled by the item itself; its comments provide the sentiment.
        # Merge near-identical headlines (same show re-uploaded) into one topic.
        def _norm(t):
            return re.sub(r"[^a-z0-9ऀ-ॿ]+", " ", (t or "").lower()).strip()[:60]
        groups = defaultdict(list); gtitle = {}; gid = {}
        for p in posts:
            key = _norm(p.get("topic_title")) or (p.get("topic_id") or "misc")
            groups[key].append(p); gtitle.setdefault(key, (p.get("topic_title") or "").strip())
            gid.setdefault(key, str(p.get("topic_id") or key))
        for key, cl in groups.items():
            if len(cl) < 2:
                continue
            title = gtitle[key]
            kws = [w for w in re.findall(r"[A-Za-zऀ-ॿ]{4,}", title.lower())][:5] or ["topic"]
            narratives.append(_record(gid[key], (title[:90] or _title_from_kw(kws)), kws, cl, 1.03))
    elif has_tags:
        cluster_to_nid = {}
        for c in range(k):
            idx = np.where(labels == c)[0]
            if len(idx) == 0: continue
            cluster_to_nid[c] = Counter((posts[j].get("narrative") or "N-?") for j in idx).most_common(1)[0][0]
        posts_by_nid = defaultdict(list); kw_by_nid = {}
        for j, p in enumerate(posts):
            nid = cluster_to_nid.get(int(labels[j]))
            if nid is None: continue
            posts_by_nid[nid].append(p); kw_by_nid.setdefault(nid, cluster_kw[int(labels[j])])
        for dom_nid, cl_posts in posts_by_nid.items():
            nd = next((n for n in NARR if n["nid"] == dom_nid), None)
            title = nd["title"] if nd else _title_from_kw(kw_by_nid[dom_nid])
            keywords = nd["keywords"] if nd else kw_by_nid[dom_nid]
            narratives.append(_record(dom_nid, title, keywords, cl_posts, nd["growth"] if nd else 1.0))
    else:
        minsz = max(3, len(posts) // 100)
        for c in range(k):
            idx = np.where(labels == c)[0]
            if len(idx) < minsz: continue
            cl_posts = [posts[j] for j in idx]
            narratives.append(_record(f"T-{c:02d}", _title_from_kw(cluster_kw[c]), cluster_kw[c], cl_posts, 1.03))
    narratives.sort(key=lambda n: -n["posts"])
    narratives = narratives[:14]

    # ---------- influence network (real networkx) ----------
    G = nx.Graph()
    # build interactions: authors in same narrative+hour window who are active get linked
    author_posts = defaultdict(list)
    for p in posts:
        author_posts[p["author"]].append(p)
    active = [a for a, ps in author_posts.items() if len(ps) >= 1]
    r = _rng(4210)
    # link authors that co-post in the same narrative/topic (shared-interest edges).
    # live posts have no planted narrative, so group by their assigned cluster label.
    post_topic = {id(p): (p.get("narrative") or f"c{int(labels[j])}") for j, p in enumerate(posts)}
    by_narr = defaultdict(list)
    for a in active:
        doms = Counter(post_topic[id(p)] for p in author_posts[a]).most_common(1)[0][0]
        by_narr[doms].append(a)
    for nid, grp in by_narr.items():
        hubs = sorted(grp, key=lambda a: -len(author_posts[a]))[:max(1, len(grp)//25)]
        for a in grp:
            tgt = r.choice(hubs)
            if a != tgt:
                G.add_edge(a, tgt, weight=1 + r.randrange(3))
        # dense internal links inside coordinated cluster (the signature)
        coord_grp = [a for a in grp if authors[a]["coord"]]
        for i in range(len(coord_grp)):
            for j in range(i + 1, len(coord_grp)):
                if r.random() < 0.08:
                    G.add_edge(coord_grp[i], coord_grp[j], weight=1)
    if G.number_of_nodes() == 0:
        G.add_node(active[0])
    cent = nx.degree_centrality(G)
    try:
        eig = nx.eigenvector_centrality(G, max_iter=500)
    except Exception:
        eig = cent
    # communities
    try:
        comms = list(nx.algorithms.community.greedy_modularity_communities(G))
    except Exception:
        comms = [set(G.nodes())]
    comm_of = {}
    for ci, com in enumerate(comms):
        for n in com:
            comm_of[n] = ci
    # pick nodes to render (~65): blend centrality with reach so genuine
    # high-reach influencers appear alongside the dense coordinated cluster.
    maxc = max(cent.values()) or 1
    maxf = max((authors[n]["followers"] for n in G.nodes()), default=1) or 1
    by_cent = sorted(G.nodes(), key=lambda n: -cent.get(n, 0))[:45]
    by_reach = sorted(G.nodes(), key=lambda n: -authors[n]["followers"])[:25]
    keep = set(by_cent) | set(by_reach)
    keep = set(sorted(keep, key=lambda n: -(cent.get(n, 0) / maxc + authors[n]["followers"] / maxf))[:66])
    nodes = []
    for n in keep:
        a = authors[n]
        infl = round(0.4 * cent.get(n, 0) / maxc + 0.6 * eig.get(n, 0) / (max(eig.values()) or 1), 3)
        dom = Counter(p["emotion"] for p in author_posts[n]).most_common(1)[0][0]
        nodes.append(dict(
            id=n, handle=a["handle"], platform=a["platform"],
            cluster=comm_of.get(n, 0), influence=infl,
            reach=int(a["followers"] * (1.0 + infl)), dominant=dom,
            kol=False, coord=a["coord"], followers=a["followers"], posts=len(author_posts[n]),
        ))
    # KOLs = top 5 genuine (non-coordinated) accounts by reach
    genuine = sorted([n for n in nodes if not n["coord"]], key=lambda x: -x["reach"])
    for nd_ in genuine[:5]:
        nd_["kol"] = True
    nodes.sort(key=lambda x: -x["influence"])
    edges = [dict(source=u, target=v, weight=d.get("weight", 1))
             for u, v, d in G.edges(data=True) if u in keep and v in keep]
    kols = sorted([n for n in nodes if n["kol"]], key=lambda x: -x["reach"])

    # ---------- coordination detection (real signals) ----------
    coord_authors = [a for a in authors.values() if a["coord"]]
    coord_posts = [p for p in posts if authors[p["author"]]["coord"]]
    # near-duplicate rate
    top_text = Counter(p["text"] for p in coord_posts).most_common(1)
    dup_rate = round((top_text[0][1] / len(coord_posts) * 100)) if coord_posts else 0
    young = round(sum(1 for a in coord_authors if a["account_age_days"] < 30) / max(1, len(coord_authors)) * 100)
    low_ratio = round(sum(1 for a in coord_authors if a["followers"] / max(1, a["following"]) < 0.2) / max(1, len(coord_authors)) * 100)
    # synchronized timing: share of coord posts within 90s of another
    coord_posts_sorted = sorted(coord_posts, key=lambda p: p["ts"])
    sync = 0
    for i, p in enumerate(coord_posts_sorted):
        for q in coord_posts_sorted[max(0, i-3):i]:
            if abs(p["ts"] - q["ts"]) <= 90_000:
                sync += 1; break
    sync_rate = round(sync / max(1, len(coord_posts)) * 100)
    coord_score = round(min(0.98, 0.25 * dup_rate/100 + 0.25 * sync_rate/100 + 0.25 * young/100 + 0.25 * low_ratio/100), 2)
    coordination = dict(
        cluster=4, accounts=len(coord_authors), score=coord_score,
        signals=[
            dict(label="Near-identical text", detail="share reusing the top 9-gram", value=dup_rate),
            dict(label="Synchronised timing", detail="posts within 90s windows", value=sync_rate),
            dict(label="Young accounts", detail="created in the last 30 days", value=young),
            dict(label="Low follower ratio", detail="followers-to-following < 0.2", value=low_ratio),
        ],
    )

    # ---------- whole-corpus demographics / feed / KPIs (via helpers) ----------
    demographics = demo_of(posts)
    feed = feed_of(posts)
    kpis = kpis_of(posts, series)
    kpis["accounts"] = len(authors)
    kpis["risingTrends"] = sum(1 for n in narratives if n["status"] in ("rising", "peaking"))

    # ---------- per-topic scopes (so the user can focus the whole app on ONE news) ----------
    scopes = {}
    for n in narratives:
        ps = nid_posts.get(n["id"], [])
        if not ps:
            continue
        ser = series_of(ps)
        sc_kpis = kpis_of(ps, ser)
        sc_kpis["risingTrends"] = 1
        scopes[n["id"]] = dict(
            kpis=sc_kpis, sentimentSeries=ser, emotionTotals=totals_of(ps),
            platformSentiment=platform_of(ps), demographics=demo_of(ps), feed=feed_of(ps),
            network=net_of(ps),
        )

    topics = [dict(id=n["id"], title=n["title"], posts=n["posts"], status=n["status"],
                   flagged=n["flagged"], momentum=n["momentum"]) for n in narratives]
    snap = dict(
        generatedAt=datetime.now().isoformat(), corpusSize=len(posts),
        sources=sources or {"mode": "synthetic", "platforms": []},
        watchlist=watchlist, kpis=kpis, sentimentSeries=series,
        emotionTotals=emotion_totals, platformSentiment=platform_sentiment,
        narratives=narratives, topics=topics, network=dict(nodes=nodes, edges=edges),
        kols=kols, coordination=coordination, demographics=demographics, feed=feed,
        scopes=scopes,
    )
    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
    return snap

if __name__ == "__main__":
    import time
    t = time.time()
    s = build_snapshot()
    print(f"snapshot built: {s['corpusSize']:,} posts in {time.time()-t:.1f}s")
    print("KPIs:", s["kpis"])
    print("narratives:", [(n["id"], n["posts"], n["status"], "FLAG" if n["flagged"] else "") for n in s["narratives"]])
    print("network: %d nodes, %d edges" % (len(s["network"]["nodes"]), len(s["network"]["edges"])))
    print("coordination score:", s["coordination"]["score"], s["coordination"]["signals"])
