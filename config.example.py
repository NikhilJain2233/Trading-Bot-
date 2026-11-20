import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

APCA_API_KEY_ID = os.getenv("APCA_API_KEY_ID")
APCA_API_SECRET_KEY = os.getenv("APCA_API_SECRET_KEY")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    str(Path(__file__).resolve().parent / "app.db"),
)
