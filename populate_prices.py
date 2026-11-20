import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import config
from alpaca.data.enums import DataFeed
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

DATABASE_PATH = Path(__file__).resolve().parent / "app.db"
SYMBOL_CHUNK_SIZE = 200
DATABASE_BATCH_SIZE = 200


def get_stock_symbols():
    connection = sqlite3.connect(DATABASE_PATH)
    try:
        rows = connection.execute(
            "SELECT symbol FROM stocks WHERE instr(symbol, '/') = 0 ORDER BY symbol"
        ).fetchall()
    finally:
        connection.close()

    symbols = [row[0] for row in rows]
    if not symbols:
        raise RuntimeError("No stock symbols found. Run populate_stock.py first.")
    return symbols


def fetch_prices(client, symbols, start, end):
    request = StockBarsRequest(
        symbol_or_symbols=symbols,
        timeframe=TimeFrame.Day,
        start=start,
        end=end,
        feed=DataFeed.IEX,
    )
    return client.get_stock_bars(request).df


def save_prices(data):
    if data.empty:
        print("Alpaca returned no price bars.")
        return 0

    connection = sqlite3.connect(DATABASE_PATH)
    try:
        with connection:
            cursor = connection.cursor()
            stock_ids = {}
            for symbol in data.index.get_level_values("symbol").unique():
                cursor.execute(
                    "INSERT OR IGNORE INTO stocks (symbol, name) VALUES (?, ?)",
                    (symbol, symbol),
                )
                cursor.execute(
                    "SELECT id FROM stocks WHERE symbol = ?",
                    (symbol,),
                )
                stock_ids[symbol] = cursor.fetchone()[0]

            batch = []
            saved_count = 0
            for (symbol, timestamp), row in data.iterrows():
                batch.append(
                    (
                        stock_ids[symbol],
                        timestamp.isoformat(),
                        float(row["open"]),
                        float(row["high"]),
                        float(row["low"]),
                        float(row["close"]),
                        int(row["volume"]),
                    )
                )

                if len(batch) == DATABASE_BATCH_SIZE:
                    _upsert_batch(cursor, batch)
                    saved_count += len(batch)
                    batch.clear()

            if batch:
                _upsert_batch(cursor, batch)
                saved_count += len(batch)
    finally:
        connection.close()

    return saved_count


def _upsert_batch(cursor, batch):
    cursor.executemany(
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
        batch,
    )


def main():
    if not config.APCA_API_KEY_ID or not config.APCA_API_SECRET_KEY:
        raise RuntimeError("Add both Alpaca keys to the .env file.")

    symbols = get_stock_symbols()
    client = StockHistoricalDataClient(
        config.APCA_API_KEY_ID,
        config.APCA_API_SECRET_KEY,
    )
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    total_fetched = 0
    total_saved = 0
    total_chunks = (len(symbols) + SYMBOL_CHUNK_SIZE - 1) // SYMBOL_CHUNK_SIZE

    for chunk_number, offset in enumerate(
        range(0, len(symbols), SYMBOL_CHUNK_SIZE),
        start=1,
    ):
        symbol_chunk = symbols[offset : offset + SYMBOL_CHUNK_SIZE]
        print(
            f"Fetching symbol chunk {chunk_number}/{total_chunks} "
            f"({len(symbol_chunk)} symbols)..."
        )
        data = fetch_prices(client, symbol_chunk, start, end)
        total_fetched += len(data)
        total_saved += save_prices(data)

    print(f"Fetched {total_fetched} price bars from Alpaca.")
    print(f"Saved {total_saved} stock-price rows to SQLite.")


if __name__ == "__main__":
    main()
