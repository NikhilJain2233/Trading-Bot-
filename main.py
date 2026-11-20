import sqlite3
from contextlib import closing
from pathlib import Path

import config
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


app = FastAPI()
templates = Jinja2Templates(directory=Path(__file__).resolve().parent / "template")


@app.get("/", response_class=HTMLResponse)
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
