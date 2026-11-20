import os
import sqlite3

from dotenv import load_dotenv
from alpaca.trading.client import TradingClient
from alpaca.trading.enums import AssetClass

load_dotenv()

api_key = os.getenv("APCA_API_KEY_ID")
secret_key = os.getenv("APCA_API_SECRET_KEY")
if not api_key or not secret_key:
    raise RuntimeError("Add both Alpaca keys to the .env file.")

client = TradingClient(api_key=api_key, secret_key=secret_key, paper=True)
assets = client.get_all_assets()

connection = sqlite3.connect("app.db")
cursor = connection.cursor()

cursor.execute("""
SELECT symbol, name FROM stocks """)
rows = cursor.fetchall()
symbols = {row[0] for row in rows}

for asset in assets:
    if (
        asset.asset_class == AssetClass.US_EQUITY
        and asset.status == "active"
        and asset.tradable
        and asset.symbol not in symbols
    ):
        cursor.execute(
            "INSERT OR IGNORE INTO stocks (symbol, name) VALUES (?, ?)",
            (asset.symbol, asset.name),
        )
        symbols.add(asset.symbol)

connection.commit()