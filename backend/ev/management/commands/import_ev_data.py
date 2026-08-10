import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from ev.models import EVChargingStation


DISTRICT_ALIASES = {
    "bhadradri": "Bhadradri Kothagudem",
    "bhadradri kothagudem": "Bhadradri Kothagudem",
    "bhuvanagiri": "Yadadri Bhuvanagiri",
    "hyderabad,": "Hyderabad",
    "hydeabad": "Hyderabad",
    "jogulamba gadwal": "Jogulamba Gadwal",
    "jogulamba, gadwal": "Jogulamba Gadwal",
    "kamareddy": "Kamareddy",
    "karimnagar - peddapalli": "Karimnagar",
    "khammam": "Khammam",
    "komaram bheem": "Komaram Bheem Asifabad",
    "mahabubnagar": "Mahabubnagar",
    "mahaboobnagar": "Mahabubnagar",
    "mahabunaga r": "Mahabubnagar",
    "malkajgiri": "Medchal Malkajgiri",
    "malkajgiri medchal": "Medchal Malkajgiri",
    "mdchal malkajgiri": "Medchal Malkajgiri",
    "medchal": "Medchal Malkajgiri",
    "medchal - malkajgiri": "Medchal Malkajgiri",
    "medchal malkajagiri": "Medchal Malkajgiri",
    "medchal malkajgiri": "Medchal Malkajgiri",
    "medchal malkajgiri": "Medchal Malkajgiri",
    "nagar kurnool": "Nagarkurnool",
    "nagarkurno ol": "Nagarkurnool",
    "nalgonda (d)": "Nalgonda",
    "nizambad": "Nizamabad",
    "pedapally": "Peddapalli",
    "peddapalli": "Peddapalli",
    "rangareddy": "Ranga Reddy",
    "ranga reddyDist,": "Ranga Reddy",
    "ranga redddy": "Ranga Reddy",
    "sanga reddy": "Sangareddy",
    "sanga reddydist,": "Sangareddy",
    "sangareddy": "Sangareddy",
    "secunderabad": "Hyderabad",
    "siddipet": "Siddipet",
    "warangal": "Warangal",
    "yadadri": "Yadadri Bhuvanagiri",
}


def normalize_name(value):
    text = str(value or "").strip().replace("\u00a0", " ")
    if not text:
        return ""
    cleaned = " ".join(text.split())
    cleaned = cleaned.replace("-", " ").replace("/", " ")
    parts = [part for part in cleaned.split() if part]
    return " ".join(parts).title()


def normalize_district(value):
    text = normalize_name(value)
    if not text:
        return ""
    key = text.lower()
    return DISTRICT_ALIASES.get(key, text)


def parse_float(value):
    if value in (None, ""):
        return 0.0
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return 0.0


def import_ev_data(csv_path):
    path = Path(csv_path)
    if not path.exists():
        raise CommandError(f"EV CSV file not found: {path}")
    with path.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    count = 0
    for row in rows:
        station_name = (row.get("Name of the EV Charging Station (Private / Public Charging Infra)") or "").strip()
        if not station_name:
            continue
        district = normalize_district(row.get("District") or "")
        state = normalize_name(row.get("State") or "")
        owner = (row.get("Name of the Owning Organisation/ Person") or "").strip()
        defaults = {
            "state": state,
            "district": district,
            "address": (row.get("Address") or "").strip(),
            "latitude": parse_float(row.get("Latitude")),
            "longitude": parse_float(row.get("Longitude")),
            "owner_organization": owner,
        }
        station, _ = EVChargingStation.objects.get_or_create(
            station_name=station_name,
            defaults=defaults,
        )
        station.station_name = station_name
        station.state = state
        station.district = district
        station.address = (row.get("Address") or "").strip()
        station.latitude = parse_float(row.get("Latitude"))
        station.longitude = parse_float(row.get("Longitude"))
        station.owner_organization = owner
        station.slug = slugify(station_name)
        station.save()
        count += 1
    return count


class Command(BaseCommand):
    help = "Import Telangana EV charging station data from the provided CSV."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", nargs="?", type=Path)

    def handle(self, *args, **options):
        from django.conf import settings
        csv_path = options["csv_path"] or settings.EV_CHARGING_STATIONS_CSV_PATH
        count = import_ev_data(csv_path)
        self.stdout.write(self.style.SUCCESS(f"Imported {count} EV charging stations."))
