from io import StringIO
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase

from ev.models import EVChargingStation


class EVImportTestCase(TestCase):
    def test_import_creates_station_records(self):
        csv_path = Path(__file__).resolve().parents[2] / "data" / "ev" / "EV_Charging_stations_details_April_2024.csv"
        out = StringIO()
        call_command("import_ev_data", csv_path, stdout=out)
        self.assertGreater(EVChargingStation.objects.count(), 0)
        station = EVChargingStation.objects.first()
        self.assertTrue(station.station_name)
        self.assertTrue(station.slug)
