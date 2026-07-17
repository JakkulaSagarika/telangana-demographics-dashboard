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

Install the backend dependencies and prepare the database:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

`migrate` automatically imports `data/telangana_districts.xlsx` when the SQLite database has no district data. The workbook path is calculated from the project directory; no absolute local path is used.

In a second terminal at the repository root, start the frontend:

```bash
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). The frontend proxies API requests to Django’s default address, `http://127.0.0.1:8000`.

## Bundled data

- `data/telangana_districts.xlsx` is the source used to populate SQLite on first migration.
- `frontend/public/data/telangana-districts.geojson` is served by Vite as the district map asset.

To deliberately refresh the database from the bundled workbook, run:

```bash
python manage.py import_birth_death_workbook data/telangana_districts.xlsx
```

The import command reports missing worksheets, invalid numbers, and unreadable files as clear command errors.
