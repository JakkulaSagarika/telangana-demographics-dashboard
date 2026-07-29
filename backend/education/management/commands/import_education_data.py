import csv
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from education.models import EducationDistrict


ALIASES = {
    "bhadradri": "Bhadradri Kothagudem", "jayashankar": "Jayashankar Bhupalpalli",
    "jogulamba": "Jogulamba Gadwal", "komaram bheem": "Komaram Bheem Asifabad",
    "medchal": "Medchal Malkajgiri", "rajanna": "Rajanna Sircilla",
    "warangal r": "Warangal Rural", "warangal u": "Warangal Urban",
    "yadadri": "Yadadri Bhuvanagiri",
}


def normalise_name(value):
    clean = " ".join((value or "").replace("(", " ").replace(")", " ").split()).lower()
    return ALIASES.get(clean, clean.title())


def number(value, float_value=False):
    raw = str(value or "0").replace(",", "").strip()
    try:
        return float(raw) if float_value else int(float(raw))
    except ValueError:
        return 0.0 if float_value else 0


def read_rows(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as source:
        return {normalise_name(row.get("Districts")): row for row in csv.DictReader(source) if row.get("Districts")}


SCHOOL_FIELDS = {
    "primary_schools": "Primary Schools", "primary_enrollment": "Primary Schools Enrollment",
    "upper_primary_schools": "Upper Primary Schools", "upper_primary_enrollment": "Upper Primary Schools Enrollment",
    "high_schools": "High Schools", "high_enrollment": "High Schools Enrollment",
    "model_schools": "Model Schools", "model_enrollment": "Model Schools Enrollment",
    "kgbv_schools": "KGBV Schools", "kgbv_enrollment": "KGBV Schools Enrollment",
    "central_schools": "Central Schools", "central_enrollment": "Central Schools Enrollment",
    "junior_colleges": "Junior Colleges", "degree_colleges": "Degree Colleges", "degree_college_seats": "Degree Colleges Seats",
    "engineering_colleges": "Engineering Colleges", "engineering_college_seats": "Engineering Colleges Seats",
    "pharmacy_colleges": "Pharmacy Colleges", "pharmacy_college_seats": "Pharmacy Colleges Seats",
    "mba_colleges": "MBA Colleges", "mba_college_seats": "MBA Colleges Seats",
    "mca_colleges": "MCA Colleges", "mca_college_seats": "MCA Colleges Seats",
    "bed_colleges": "B.Ed. Colleges", "bed_college_seats": "B.Ed. Colleges Seats",
    "law_colleges": "Law Colleges", "law_college_seats": "Law Colleges Seats",
}


def import_education_data(literacy_csv, schools_csv):
    literacy, schools = read_rows(literacy_csv), read_rows(schools_csv)
    names = sorted(set(literacy) | set(schools))
    for name in names:
        literacy_row, school_row = literacy.get(name, {}), schools.get(name, {})
        male_literate = number(literacy_row.get("Males"))
        female_literate = number(literacy_row.get("Females"))
        male_rate = number(literacy_row.get("Literacy Rate Males"), True)
        female_rate = number(literacy_row.get("Literacy Rate Females"), True)
        male_base = male_literate / (male_rate / 100) if male_rate else 0
        female_base = female_literate / (female_rate / 100) if female_rate else 0
        literacy_rate = round((male_literate + female_literate) / (male_base + female_base) * 100, 2) if male_base + female_base else 0
        defaults = {
            "male_literate": male_literate, "female_literate": female_literate,
            "male_literacy_rate": male_rate, "female_literacy_rate": female_rate,
            "literacy_rate": literacy_rate,
            **{field: number(school_row.get(header)) for field, header in SCHOOL_FIELDS.items()},
        }
        EducationDistrict.objects.update_or_create(name=name, defaults={"slug": slugify(name), **defaults})
    return len(names)


class Command(BaseCommand):
    help = "Import Telangana education literacy, school, college, enrollment and seat data."

    def add_arguments(self, parser):
        parser.add_argument("literacy_csv", nargs="?", type=Path)
        parser.add_argument("schools_csv", nargs="?", type=Path)

    def handle(self, *args, **options):
        from django.conf import settings
        literacy_csv = options["literacy_csv"] or settings.EDUCATION_LITERACY_CSV_PATH
        schools_csv = options["schools_csv"] or settings.EDUCATION_SCHOOLS_CSV_PATH
        if not literacy_csv.exists() or not schools_csv.exists():
            raise CommandError("Both education CSV files must be available in data/education.")
        count = import_education_data(literacy_csv, schools_csv)
        self.stdout.write(self.style.SUCCESS(f"Imported education data for {count} districts."))
