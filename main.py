import sqlite3
from contextlib import closing
from pathlib import Path

import config
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI()
frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
app.mount(
    "/assets",
    StaticFiles(directory=frontend_dist / "assets", check_dir=False),
    name="assets",
)


@app.get("/api/stocks")
def list_stocks():
    with closing(sqlite3.connect(config.DATABASE_URL)) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            "SELECT id, symbol, name FROM stocks ORDER BY symbol"
        ).fetchall()

    return [dict(row) for row in rows]


@app.get("/api/stocks/{symbol}")
def stock_detail(symbol: str):
    with closing(sqlite3.connect(config.DATABASE_URL)) as connection:
        connection.row_factory = sqlite3.Row
        stock = connection.execute(
            "SELECT id, symbol, name FROM stocks WHERE symbol = ?",
            (symbol.upper(),),
        ).fetchone()

        if stock is None:
            raise HTTPException(status_code=404, detail="Stock not found")

        prices = connection.execute(
            """
            SELECT date, open, close, high, low
            FROM stock_price
            WHERE stock_id = ?
            ORDER BY date DESC
            """,
            (stock["id"],),
        ).fetchall()

    return {
        "stock": dict(stock),
        "prices": [dict(price) for price in prices],
    }


@app.get("/{full_path:path}", include_in_schema=False)
def frontend(full_path: str):
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    index_file = frontend_dist / "index.html"
    if not index_file.is_file():
        raise HTTPException(
            status_code=503,
            detail="React frontend is not built. Run `npm run build` in the frontend directory.",
        )

    return FileResponse(index_file)
