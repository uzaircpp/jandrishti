"""
Seed training data for the JanDrishti emotion model.

Six labels: supportive, excitement, anxiety, sarcasm, against, neutral.
Four language styles: English, Hindi (Devanagari), Hinglish (romanised), Marathi.

Training examples are generated from hand-written templates x topic slots, so the
model learns emotion cues rather than one topic's vocabulary. The *test* set in
eval_set.py is written by hand and never generated, so reported metrics measure
generalisation, not template recall.

In production this seed set is replaced/augmented with annotated corpora
(e.g. SentiMix code-mixed sentiment, GoEmotions, iSarcasm) - see MODEL_CARD.md.
"""
import random

LABELS = ["supportive", "excitement", "anxiety", "sarcasm", "against", "neutral"]

# Topic slots: (english, hindi, hinglish, marathi)
TOPICS = [
    ("the new metro line", "नई मेट्रो लाइन", "nayi metro line", "नवी मेट्रो लाइन"),
    ("the education policy", "शिक्षा नीति", "education policy", "शिक्षण धोरण"),
    ("the flood relief work", "बाढ़ राहत कार्य", "flood relief ka kaam", "पूर मदत कार्य"),
    ("the new payment rule", "नया भुगतान नियम", "naya payment rule", "नवा पेमेंट नियम"),
    ("the city hospital", "शहर का अस्पताल", "city hospital", "शहरातील रुग्णालय"),
    ("the road project", "सड़क परियोजना", "road project", "रस्ता प्रकल्प"),
    ("the exam results", "परीक्षा परिणाम", "exam results", "परीक्षेचा निकाल"),
    ("the water supply", "पानी की सप्लाई", "paani ki supply", "पाणीपुरवठा"),
    ("the new app", "नया ऐप", "naya app", "नवीन अॅप"),
    ("the festival arrangements", "त्योहार की व्यवस्था", "festival ka arrangement", "सणाची व्यवस्था"),
    ("the cricket final", "क्रिकेट फाइनल", "cricket final", "क्रिकेट अंतिम सामना"),
    ("the bus service", "बस सेवा", "bus service", "बस सेवा"),
]

# Templates per label per language; {t} is the topic slot.
T = {
    "supportive": {
        "en": ["Really happy with {t}, great work by everyone involved",
               "{t} is a big step forward, fully support it",
               "Credit where due, {t} has been handled well",
               "Glad to see {t} finally done properly",
               "{t} will help so many people, proud of this",
               "Honestly impressed with {t}, keep it up",
               "Good decision on {t}, this is what we needed"],
        "hi": ["{t} बहुत अच्छा काम है, पूरा समर्थन",
               "{t} से लोगों को बहुत फायदा होगा",
               "{t} के लिए धन्यवाद, शानदार पहल",
               "आखिरकार {t} अच्छे से हुआ, गर्व है"],
        "hl": ["{t} sach me bahut accha hai, full support",
               "{t} se logon ka bahut fayda hoga yaar",
               "{t} ke liye thank you, badhiya kaam",
               "finally {t} sahi se hua, proud feel ho raha hai"],
        "mr": ["{t} खूप छान काम आहे, पूर्ण पाठिंबा",
               "{t} मुळे लोकांना खूप फायदा होईल",
               "{t} साठी धन्यवाद, उत्तम उपक्रम"],
    },
    "excitement": {
        "en": ["Can't wait for {t}!! This is going to be amazing",
               "OMG {t} is finally here, so excited 🎉",
               "Counting the hours till {t}, let's gooo",
               "{t} today!!! Absolutely buzzing",
               "Waited years for {t}, it's finally happening!"],
        "hi": ["{t} का बेसब्री से इंतज़ार है!!",
               "वाह {t} आखिरकार आ गया, बहुत उत्साहित हूँ 🎉",
               "{t} आज है!!! मज़ा आएगा"],
        "hl": ["{t} ka wait nahi ho raha!! maza aayega",
               "omg {t} finally aa gaya, bahut excited hoon 🎉",
               "{t} aaj hai bhai!!! chalo chalo"],
        "mr": ["{t} ची आतुरतेने वाट पाहतोय!!",
               "{t} शेवटी आलं, खूप उत्सुक आहे 🎉"],
    },
    "anxiety": {
        "en": ["Really worried about {t}, what if it goes wrong",
               "Feeling uneasy about {t}, nobody is telling us anything",
               "Scared about how {t} will affect my family",
               "Is {t} even safe? I'm getting nervous",
               "Not sure we are ready for {t}, quite concerned",
               "{t} has me stressed, hope there is a backup plan"],
        "hi": ["{t} को लेकर बहुत चिंता हो रही है",
               "{t} से डर लग रहा है, क्या होगा अब",
               "{t} सुरक्षित है भी या नहीं? घबराहट हो रही है"],
        "hl": ["{t} ko lekar bahut tension ho rahi hai",
               "{t} se dar lag raha hai, ab kya hoga",
               "{t} safe hai bhi ya nahi? ghabrahat ho rahi hai"],
        "mr": ["{t} बद्दल खूप काळजी वाटते",
               "{t} मुळे भीती वाटत आहे, आता काय होणार"],
    },
    "sarcasm": {
        "en": ["Wow, {t} worked on the first try, truly a miracle 🙄",
               "Oh great, {t} again. Exactly what I wanted to deal with today",
               "Sure, {t} is going perfectly. Totally not