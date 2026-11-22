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

Install and build the React frontend (requires Node.js and npm):

```powershell
Set-Location frontend
npm install
npm run build
Set-Location ..
```

Initialize the SQLite database and start the dashboard:

```powershell
python createdb.py
python -m uvicorn main:app --reload --host 127.0.0.1 --port 18500
```

Open [http://127.0.0.1:18500/stocks](http://127.0.0.1:18500/stocks) in your browser.
For frontend development, run `npm run dev` from `frontend` while the FastAPI
server is running; Vite proxies API requests to port 18500. The local database,
`.env`, `config.py`, virtual environment, and frontend build output are
intentionally excluded from version control.
