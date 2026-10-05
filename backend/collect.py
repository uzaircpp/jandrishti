# Build a snapshot from live data (or synthetic fallback) from the command line.
#   python collect.py            # live if configured, else synthetic
#   python collect.py --synthetic
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
try:
    from dotenv import load_dotenv; load_dotenv(HERE / ".env")
except ImportError:
    pass
import live, pipeline
if "--synthetic" in sys.argv:
    s = pipeline.build_snapshot(); print("synthetic:", s["corpusSize"], "posts")
else:
    print("Configured:", live.sources_status())
    s = live.build_live_snapshot()
    if not s:
        s = pipeline.build_snapshot(); print("fell back to synthetic:", s["corpusSize"], "posts")
