# Telangana Demographics Dashboard

A React + Vite dashboard backed by Django REST Framework and SQLite. The repository includes the NIC birth/death workbook and Telangana district GeoJSON boundaries, so a fresh clone starts with data and a map on Windows, macOS, and Linux.

## Requirements

- Python 3.12 or newer
- Node.js 20 or newer

## Run locally

From the repository root, create and activate a virtual environment:

```bash
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies and start the backend:

```bash
pip install -r requirements.txt
python manage.py runserver
```

On `runserver`, the project automatically creates SQLite if needed, applies migrations, and imports bundled data idempotently. No separate seed command is needed. All paths are calculated from the project directory; no absolute local path is used.

In a second terminal at the repository root, start the frontend:

```bash
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). The frontend proxies API requests to Django’s default address, `http://127.0.0.1:8000`.

## Bundled data

- `data/telangana_districts.xlsx` is the source used to populate SQLite on first migration.
- `data/education/` contains every CSV used by Education Dashboard: literacy, 2016–17 through 2021–22 school reports, 2018–19 and 2020–21 college reports, and 2021–22 dropout data. They are imported from the repository on startup; multi-year visualizations read these bundled files directly.
- `frontend/public/data/telangana-districts.geojson` is served by Vite as the district map asset.

To deliberately refresh the database from the bundled workbook, run:

```bash
python manage.py import_birth_death_workbook data/telangana_districts.xlsx
```

The import command reports missing worksheets, invalid numbers, and unreadable files as clear command errors.
