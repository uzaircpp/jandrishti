# -*- coding: utf-8 -*-
"""SIH26152 pitch sheet: USP / challenges / feasibility / differentiators."""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
import os

OUT = r"C:\Users\uzair\Downloads\SIH26152-Pitch-Strategy.pdf"

INK=(0.10,0.13,0.18); MUTED=(0.36,0.42,0.52); FAINT=(0.62,0.67,0.74)
LINE=(0.82,0.86,0.90); WHITE=(1,1,1); BG=(0.97,0.98,0.99)
BLUE=((0.18,0.44,0.69),(0.90,0.94,0.99),(0.62,0.74,0.88))
GREEN=((0.13,0.53,0.36),(0.89,0.97,0.93),(0.58,0.80,0.68))
AMBER=((0.72,0.48,0.10),(0.99,0.95,0.86),(0.88,0.76,0.52))
VIOLET=((0.46,0.30,0.62),(0.96,0.93,0.99),(0.78,0.66,0.88))
RED=((0.72,0.20,0.24),(0.99,0.92,0.92),(0.90,0.66,0.66))
W,H=A4

c=canvas.Canvas(OUT,pagesize=A4)

def bg(): c.setFillColorRGB(*WHITE); c.rect(0,0,W,H,fill=1,stroke=0)
def wrap(text,font,size,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if stringWidth(t,font,size)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines
def para(x,y,text,size=9.5,color=MUTED,font="Helvetica",maxw=W-80,lead=13):
    c.setFillColorRGB(*color); c.setFont(font,size)
    for ln in wrap(text,font,size,maxw):
        c.drawString(x,y,ln); y-=lead
    return y
def section(y,title,col=BLUE):
    c.setFillColorRGB(*col[0]); c.setFont("Helvetica-Bold",10)
    c.drawString(40,y,title.upper())
    c.setStrokeColorRGB(*LINE); c.setLineWidth(1); c.line(40,y-6,W-40,y-6)
    return y-22
def foot(txt):
    c.setFillColorRGB(*FAINT); c.setFont("Helvetica",8); c.drawString(40,28,txt)

# ---------------- PAGE 1 ----------------
bg()
c.setFillColorRGB(*VIOLET[0]); c.rect(0,H-10,W,10,fill=1,stroke=0)
c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",11)
c.drawString(40,H-58,"SMART INDIA HACKATHON 2026  ·  SIH26152  ·  NTRO")
c.setFont("Helvetica-Bold",27); c.drawString(40,H-96,"Pitch & Strategy")
c.setFillColorRGB(*MUTED); c.setFont("Helvetica",12)
c.drawString(40,H-118,"USP  ·  Challenges  ·  Feasibility  ·  How we outshine the field")

# reframe card
cy=H-300
c.setFillColorRGB(*VIOLET[1]); c.setStrokeColorRGB(*VIOLET[2]); c.setLineWidth(1)
c.roundRect(40,cy,W-80,150,8,stroke=1,fill=1)
c.setFillColorRGB(*VIOLET[0]); c.setFont("Helvetica-Bold",10)
c.drawString(56,cy+150-26,"THE REFRAME THAT MAKES US SHINE")
yy=para(56,cy+150-46,
  "~80 teams will build a marketing analytics dashboard. We pitch a narrative-intelligence and "
  "early-warning system. Same components (A-E), a completely different frame - and the frame is what "
  "matches NTRO's mission. They are an intelligence organisation, not a brand.",
  10,INK,"Helvetica",W-120,14)
c.setFillColorRGB(*VIOLET[0]); c.setFont("Helvetica-BoldOblique",11.5)
c.drawString(56,cy+18,"\"Not just what people are saying - who's steering it,")
c.drawString(56,cy+3,"where it's heading, and when to act.\"")

# two-sentence USP
by=cy-30
b2=section(by,"Our USP, in two sentences")
c.setFillColorRGB(*BG); c.setStrokeColorRGB(*LINE)
c.roundRect(40,b2-96,W-80,92,8,stroke=1,fill=1)
para(56,b2-24,
  "Most tools tell you what an audience is saying. AudienceIntel tells you WHO is steering the "
  "conversation, WHETHER it is authentic, and WHERE it is heading - across Indian languages, on one "
  "timeline, with every insight explainable.",
  11,INK,"Helvetica-Oblique",W-120,16)
foot("SIH26152  ·  pitch & strategy  ·  page 1 of 4")
c.showPage()

# ---------------- PAGE 2 : USP ----------------
bg()
c.setFillColorRGB(*BLUE[0]); c.rect(0,H-8,W,8,fill=1,stroke=0)
c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",16)
c.drawString(40,H-46,"USP - Six differentiators competitors won't have")
c.setFillColorRGB(*MUTED); c.setFont("Helvetica",9.5)
c.drawString(40,H-62,"Everyone builds the dashboard. These are the things the other teams skip.")

usps=[
 ("1","Code-mixed & Indian-language NLP","Hinglish, Devanagari, regional languages","Others use English-only VADER/TextBlob and mis-read half the data.",GREEN),
 ("2","Sarcasm + nuanced emotion (fine-tuned)","The PS explicitly names sarcasm - a graded requirement","Others do positive/negative/neutral and skip sarcasm.",BLUE),
 ("3","Predictive trends, not just detection","The PS says 'predict rising trends' - forecast virality early","Others show a trending list only: detection, no prediction.",AMBER),
 ("4","Coordinated / inauthentic behaviour detection","NTRO's core interest: influence ops, bot nets, astroturfing","Others never think of it - this is our knockout feature.",RED),
 ("5","Temporal influence spread (time-slider replay)","Show HOW a narrative propagated, not a static graph","Others render one static network graph.",VIOLET),
 ("6","Explainable + confidence-scored insights","Intelligence tools need auditability, not a black box","Others output numbers with no 'why'.",GREEN),
]
y=H-88
for tag,name,why,others,col in usps:
    h=66
    c.setFillColorRGB(*col[1]); c.setStrokeColorRGB(*col[2]); c.setLineWidth(1)
    c.roundRect(40,y-h,W-80,h,7,stroke=1,fill=1)
    c.setFillColorRGB(*col[0]); c.circle(66,y-h/2,13,fill=1,stroke=0)
    c.setFillColorRGB(*WHITE); c.setFont("Helvetica-Bold",13); c.drawCentredString(66,y-h/2-5,tag)
    c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",11.5); c.drawString(90,y-20,name)
    c.setFillColorRGB(*MUTED); c.setFont("Helvetica",9); c.drawString(90,y-34,"Why it wins:  "+why)
    c.setFillColorRGB(*col[0]); c.setFont("Helvetica-Oblique",9); c.drawString(90,y-50,others)
    y-=h+8
# knockout note
c.setFillColorRGB(*RED[1]); c.setStrokeColorRGB(*RED[2])
c.roundRect(40,y-34,W-80,30,6,stroke=1,fill=1)
c.setFillColorRGB(*RED[0]); c.setFont("Helvetica-Bold",9); c.drawString(52,y-16,"HEADLINE:")
c.setFillColorRGB(*INK); c.setFont("Helvetica",9)
c.drawString(112,y-16,"#4 turns a dashboard into a threat-detection tool - and fits the Blockchain & Cybersecurity theme.")
foot("SIH26152  ·  pitch & strategy  ·  page 2 of 4")
c.showPage()

# ---------------- PAGE 3 : CHALLENGES + FEASIBILITY ----------------
bg()
c.setFillColorRGB(*AMBER[0]); c.rect(0,H-8,W,8,fill=1,stroke=0)
c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",16)
c.drawString(40,H-46,"Challenges & Feasibility")
c.setFillColorRGB(*MUTED); c.setFont("Helvetica",9.5)
c.drawString(40,H-62,"Naming our own limits and their fixes reads as senior - and survives Q&A.")

y=H-88
y=section(y,"Challenges & how we beat them",AMBER)
ch=[
 ("X / Twitter API paid & throttled","HIGH","Lead the live demo with Telegram + Reddit + YouTube (free, official; Telegram is 'essential'). Pluggable collectors so X drops in when access exists."),
 ("Sarcasm / code-mixed accuracy","MED","Fine-tune on code-mixed corpora; show confidence, never overclaim."),
 ("Demographics are inferences","MED","Present as aggregate, anonymized, probabilistic with confidence - a privacy STRENGTH."),
 ("Real-time at scale","MED","MVP on one machine + queue; Kafka/worker architecture is the shown scale path."),
 ("Ground truth for evaluation","MED","Evaluate on labeled public data + a small hand-labeled set; report real F1."),
]
for name,sev,fix in ch:
    c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",10); c.drawString(48,y,name)
    scol=RED if sev=="HIGH" else AMBER
    c.setFillColorRGB(*scol[0]); c.setFont("Helvetica-Bold",8); c.drawRightString(W-48,y,sev)
    y-=14
    y=para(48,y,"Fix:  "+fix,9,MUTED,"Helvetica",W-96,12)-6

y-=6
y=section(y,"Feasibility - why we can actually ship this",GREEN)
y=para(48,y,"Verdict: highly feasible for a strong MVP - we stand on pre-trained models and free APIs. The hard part is integration and polish, not invention.",9.5,INK,"Helvetica-Bold",W-96,13)-4
feas=[
 ("A · Ingest","Telethon / PRAW / YouTube API - days, not weeks"),
 ("B · Sentiment","pre-trained HuggingFace; fine-tune only for sarcasm / code-mix"),
 ("C · Demographics","rules + light model on bios - bounded scope"),
 ("D · Trends","BERTopic + a simple forecaster - off the shelf"),
 ("E · Network","networkx - mature library"),
 ("Coordination detection","built on the SAME graph + timing data - incremental, not new"),
]
for a,b in feas:
    c.setFillColorRGB(*GREEN[0]); c.setFont("Helvetica-Bold",9.5); c.drawString(48,y,a)
    c.setFillColorRGB(*MUTED); c.setFont("Helvetica",9.5); c.drawString(200,y,b); y-=15
foot("SIH26152  ·  pitch & strategy  ·  page 3 of 4")
c.showPage()

# ---------------- PAGE 4 : BETTER + NARRATIVE ----------------
bg()
c.setFillColorRGB(*GREEN[0]); c.rect(0,H-8,W,8,fill=1,stroke=0)
c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",16)
c.drawString(40,H-46,"How we make it better  &  the winning pitch")

y=H-78
y=section(y,"Concrete features that shine (not generic)",GREEN)
feat=[
 ("Unified timeline","sentiment, trends & spread scrub against one time axis (PS stresses chronology 4x)"),
 ("Narrative cards","auto-cluster posts into narratives with sentiment, size, momentum, top drivers"),
 ("Early-warning alerts","fire when negativity spikes or a narrative accelerates - operational, not passive"),
 ("Diffusion replay","play button animates node-to-node spread over time - demo gold"),
 ("Influencer dossier","click a KOL -> reach, dominant sentiment, narratives they seed"),
 ("Coordination score","flag clusters of accounts acting in lockstep, with evidence"),
 ("Explainability panel","every score links to the actual posts behind it = trust"),
 ("Privacy layer","anonymized @node_id, aggregate-only demographics, stated clearly"),
]
for a,b in feat:
    c.setFillColorRGB(*INK); c.setFont("Helvetica-Bold",9.5); c.drawString(48,y,a)
    c.setFillColorRGB(*MUTED); c.setFont("Helvetica",9);
    for i,ln in enumerate(wrap(b,"Helvetica",9,W-210)):
        c.drawString(190,y-(i*11),ln)
    y-=max(15,11*len(wrap(b,"Helvetica",9,W-210))+3)

y-=8
y=section(y,"The winning pitch narrative (memorise the arc)",VIOLET)
arc=[
 "1  Problem - understanding a community means 4 questions (feel / who / what / who steers); today it's manual and fragmented.",
 "2  Our system - one platform answers all four on a single timeline, AND flags coordinated manipulation AND predicts what's next.",
 "3  Live demo - load a topic -> sentiment (with sarcasm) -> rising narratives -> influence-graph replay -> a coordination alert fires.",
 "4  Why us - multilingual, predictive, explainable, privacy-safe - and it catches influence operations, which is what matters to NTRO.",
 "5  Feasibility - working MVP today on free APIs; clear scale path.",
]
for line in arc:
    y=para(48,y,line,9.5,INK,"Helvetica",W-96,13)-4

# closing banner
c.setFillColorRGB(*VIOLET[1]); c.setStrokeColorRGB(*VIOLET[2])
c.roundRect(40,y-62,W-80,56,7,stroke=1,fill=1)
c.setFillColorRGB(*VIOLET[0]); c.setFont("Helvetica-Bold",9); c.drawString(54,y-22,"HOW WE OUTCLASS 80 TEAMS")
para(54,y-37,
  "Same requirements, reframed as intelligence - with coordinated-behaviour detection + "
  "prediction + multilingual as the three things nobody else brings.",
  9.5,INK,"Helvetica",W-108,13)
foot("SIH26152  ·  pitch & strategy  ·  page 4 of 4")
c.showPage()
c.save()
print("WROTE",OUT)
