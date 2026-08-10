import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from education.management.commands.import_education_data import normalise_name
from education.models import EducationDropout


def integer_or_none(value):
    raw = str(value or "").replace(",", "").strip()
    if not raw:
        return None
    return int(float(raw))


def number(value):
    raw = str(value or "0").replace(",", "").strip()
    try:
        return float(raw)
    except ValueError:
        return 0


def import_dropout_data(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source))
    for row in rows:
        name = normalise_name(row.get("Districts"))
        if not name:
            continue
        EducationDropout.objects.update_or_create(
            name=name,
            defaults={
                "slug": slugify(name),
                "primary_enrollment": integer_or_none(row.get("Primary Schools Enrollment")) or 0,
                "upper_primary_enrollment": integer_or_none(row.get("Upper Primary Schools Enrollment")) or 0,
                "high_school_enrollment": integer_or_none(row.get("High Schools Enrollment")) or 0,
                "primary_dropout_rate": number(row.get("Primary Dropout Rate (%)")),
                "upper_primary_dropout_rate": number(row.get("Upper Primary Dropout Rate (%)")),
                "high_school_dropout_rate": number(row.get("High School Dropout Rate (%)")),
                "estimated_primary_dropouts": integer_or_none(row.get("Estimated Primary Dropouts")),
                "estimated_upper_primary_dropouts": integer_or_none(row.get("Estimated Upper Primary Dropouts")),
                "estimated_high_school_dropouts": integer_or_none(row.get("Estimated High School Dropouts")),
                "data_year": row.get("Dropout Data Year", ""),
                "data_source": row.get("Dropout Data Source", ""),
                "count_note": row.get("Count Note", ""),
            },
        )
    return len(rows)


class Command(BaseCommand):
    help = "Import district dropout data from the uploaded 2021-22 CSV."

    def add_arguments(self, parser):
        parser.add_argument("dropout_csv", nargs="?", type=Path)

    def handle(self, *args, **options):
        from django.conf import settings
        dropout_csv = options["dropout_csv"] or settings.EDUCATION_DROPOUT_CSV_PATH
        if not dropout_csv.exists():
            raise CommandError("The dropout CSV must be available in data/education.")
        count = import_dropout_data(dropout_csv)
        self.stdout.write(self.style.SUCCESS(f"Imported dropout data for {count} districts."))
