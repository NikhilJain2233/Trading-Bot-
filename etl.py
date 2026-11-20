import sqlite3
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from pathlib import Path

import config
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from alpaca.data.enums import DataFeed

if not config.APCA_API_KEY_ID or not config.APCA_API_SECRET_KEY:
    raise RuntimeError("Add both Alpaca keys to the .env file.")

client = StockHistoricalDataClient(
    config.APCA_API_KEY_ID,
    config.APCA_API_SECRET_KEY,
)

symbols = ["AAPL", "MSFT", "NVDA"]
DATABASE_PATH = Path(__file__).resolve().parent / "app.db"


def extract_data():
    try:
        end = datetime.now(timezone.utc)
        start = end - timedelta(days=10)

        request = StockBarsRequest(
            symbol_or_symbols=symbols,
            timeframe=TimeFrame.Day,
            start=start,
            end=end,
            feed=DataFeed.IEX,
        )

        barset = client.get_stock_bars(request)
        df = barset.df.reset_index()
        print(f"Extracted {len(df)} records")

        return df

    except Exception as error:
        print(f"Error occurred: {error}")
        raise


def transform_data(df):
    if df is None or df.empty:
        print("No data to transform")
        return []

    required_columns = [
        "symbol",
        "timestamp",
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]
    missing = set(required_columns) - set(df.columns)

    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    records = []

    for _, row in df.iterrows():
        if row[required_columns].isna().any():
            continue

        open_price = Decimal(str(row["open"]))
        high_price = Decimal(str(row["high"]))
        low_price = Decimal(str(row["low"]))
        close_price = Decimal(str(row["close"]))

        if high_price < max(open_price, low_price, close_price):
            raise ValueError("Invalid high price")

        if low_price > min(open_price, high_price, close_price):
            raise ValueError("Invalid low price")

        timestamp = row["timestamp"]
        if hasattr(timestamp, "to_pydatetime"):
            timestamp = timestamp.to_pydatetime()
        elif isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)

        records.append(
            {
                "symbol": str(row["symbol"]),
                "timestamp": timestamp.isoformat(),
                "open": float(open_price),
                "high": float(high_price),
                "low": float(low_price),
                "close": float(close_price),
                "volume": int(row["volume"]),
            }
        )

    print(f"Transformed {len(records)} records")

    return records


def load_data(records):
    if not records:
        print("No records to load")
        return

    with sqlite3.connect(DATABASE_PATH) as connection:
        cursor = connection.cursor()
        loaded = 0
        for record in records:
            cursor.execute(
                "SELECT id FROM stocks WHERE symbol = ?",
                (record["symbol"],),
            )
            stock = cursor.fetchone()
            if stock is None:
                cursor.execute(
                    "INSERT OR IGNORE INTO stocks (symbol, name) VALUES (?, ?)",
                    (record["symbol"], record["symbol"]),
                )
                stock_id = cursor.lastrowid
            else:
                stock_id = stock[0]

            cursor.execute(
                """
                INSERT INTO stock_price
                    (stock_id, date, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (stock_id, date) DO UPDATE SET
                    open = excluded.open,
                    high = excluded.high,
                    low = excluded.low,
                    close = excluded.close,
                    volume = excluded.volume
                """,
                (
                    stock_id,
                    record["timestamp"],
                    record["open"],
                    record["high"],
                    record["low"],
                    record["close"],
                    record["volume"],
                ),
            )
            loaded += 1

    print(f"Loaded {loaded} records into SQLite")


def run_etl():
    print("\nStarting ETL pipeline...")

    try:
        raw_data = extract_data()
        transformed_data = transform_data(raw_data)
        load_data(transformed_data)

        print("ETL pipeline completed successfully!")

    except Exception as error:
        print(f"ETL pipeline failed: {error}")
        raise


if __name__ == "__main__":
    run_etl()
