# One-time interactive Telegram login. Creates models/telegram.session so the
# collector can read public channels non-interactively afterwards.
#   python telegram_login.py
import os
from pathlib import Path
HERE = Path(__file__).resolve().parent
try:
    from dotenv import load_dotenv; load_dotenv(HERE / ".env")
except ImportError:
    pass
from telethon.sync import TelegramClient
api_id = int(os.environ["TELEGRAM_API_ID"]); api_hash = os.environ["TELEGRAM_API_HASH"]
with TelegramClient(str(HERE / "models" / "telegram"), api_id, api_hash) as client:
    me = client.get_me()
    print("Logged in as", me.username or me.first_name, "- session saved.")
