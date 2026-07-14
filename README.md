# Telangana Demographics Dashboard

A React + Vite dashboard backed by Django REST Framework and SQLite. It provides an interactive Telangana district map, individual district profiles, rankings, and a searchable data table.

## Technology choices

- **Map:** Leaflet + React Leaflet with a Telangana district GeoJSON boundary file.
- **Charts:** Recharts (responsive React charts).
- **API:** Django REST Framework.
- **Data storage:** SQLite during development. Use PostgreSQL if the project later needs multiple editors or public deployment.
- **Data import:** `openpyxl` to read the Excel workbook.

## 1. Prepare district data

Use the headers in [`data/district-data-template.csv`](data/district-data-template.csv) as the Excel workbook's first row. Required headers are `name`, `population_total`, `population_male`, and `population_female`; the remaining headers are optional but power the full dashboard. Put one interesting fact per line in the `facts` cell.

When your workbook is ready, install the Excel reader and import it:

```bash
cd backend
../.venv/bin/pip install openpyxl
../.venv/bin/python manage.py makemigrations demographics
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py import_districts ../data/telangana_districts.xlsx
```

To update data later, run the same import command. It updates rows by district name.

## 2. Add Telangana district geometry

Convert your `.shp` boundary file to GeoJSON and place it at `frontend/public/data/telangana-districts.geojson`. See [`frontend/public/data/README.md`](frontend/public/data/README.md) for the required district-name property.

## 3. Run the dashboard

Use two terminals:

```bash
# Terminal 1
cd backend
../.venv/bin/python manage.py runserver 8002

# Terminal 2
cd frontend
npm install
npm run dev
```

Open the local Vite address (normally `http://localhost:5173`). Hovering a map district shows male/female population; clicking it opens the corresponding profile.

## Data notes

Use an authoritative source and record its reporting year in `source_year`. Collector names, births/deaths, and administrative counts change over time, so refresh them before presenting or publishing the dashboard.
