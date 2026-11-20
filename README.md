# Trading Bot

## Setup

Create and activate a virtual environment, then install the project dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Create local configuration files and add your Alpaca API credentials to `.env`:

```powershell
Copy-Item .env.example .env
Copy-Item config.example.py config.py
```

Initialize the SQLite database and start the dashboard:

```powershell
python createdb.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 18500
```

Open [http://127.0.0.1:18500/](http://127.0.0.1:18500/) in your browser. The local
database, `.env`, `config.py`, and virtual environment are intentionally excluded
from version control.
