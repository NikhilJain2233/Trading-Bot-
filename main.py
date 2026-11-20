import sqlite3
from contextlib import closing
from pathlib import Path

import config
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


app = FastAPI()
templates = Jinja2Templates(directory=Path(__file__).resolve().parent / "template")


@app.get("/stocks", response_class=HTMLResponse)
def index(request: Request):
    with closing(sqlite3.connect(config.DATABASE_URL)) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            "SELECT id, symbol, name FROM stocks ORDER BY symbol"
        ).fetchall()

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"title": "Dashboard", "stocks": rows},
    )

@app.get("/stocks/{symbol}", response_class=HTMLResponse)
def stock_detail(request: Request, symbol: str):
    with closing(sqlite3.connect(config.DATABASE_URL)) as connection:
        connection.row_factory = sqlite3.Row
        stock = connection.execute(
            "SELECT id, symbol, name FROM stocks WHERE symbol = ?",
            (symbol.upper(),),
        ).fetchone()

        if stock is None:
            raise HTTPException(status_code=404, detail="Stock not found")

        latest_price = connection.execute(
            """
            SELECT date, close
            FROM stock_price
            WHERE stock_id = ?
            ORDER BY date DESC
            LIMIT 1
            """,
            (stock["id"],),
        ).fetchone()

    return templates.TemplateResponse(
        request=request,
        name="stock_detail.html",
        context={"stock": stock, "price": latest_price},
    )
