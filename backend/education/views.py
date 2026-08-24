import csv
from pathlib import Path

from django.conf import settings
from django.utils.text import slugify
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import EducationDistrict, EducationDropout


MULTI_SCHOOL_FIELDS = {
    "Primary": ("Primary Schools", "Primary Schools Enrollment"),
    "Upper primary": ("Upper Primary Schools", "Upper Primary Schools Enrollment"),
    "High": ("High Schools", "High Schools Enrollment"),
    "Higher secondary": ("Higher Secondary Schools", "Higher Secondary Schools Enrollment"),
    "Model": ("Model Schools", "Model Schools Enrollment"),
    "KGBV": ("KGBV Schools", "KGBV Schools Enrollment"),
    "Central": ("Central Schools", "Central Schools Enrollment"),
}
MULTI_COLLEGE_FIELDS = {
    "Junior": ("Junior Colleges", None), "Degree": ("Degree Colleges", "Degree Colleges Seats"),
    "Engineering": ("Engineering Colleges", "Engineering Colleges Seats"), "Pharmacy": ("Pharmacy Colleges", "Pharmacy Colleges Seats"),
    "MBA": ("MBA Colleges", "MBA Colleges Seats"), "MCA": ("MCA Colleges", "MCA Colleges Seats"),
    "B.Ed.": ("B.Ed. Colleges", "B.Ed. Colleges Seats"), "Law": ("Law Colleges", "Law Colleges Seats"),
}
MULTI_NAME_ALIASES = {
    "bhadradri": "Bhadradri Kothagudem", "jayashankar": "Jayashankar Bhupalpalli",
    "jogulamba": "Jogulamba Gadwal", "kumuram bheem": "Komaram Bheem Asifabad",
    "komaram bheem": "Komaram Bheem Asifabad", "medchal": "Medchal Malkajgiri",
    "medchal-malkajigiri": "Medchal Malkajgiri", "rajanna": "Rajanna Sircilla",
    "warangal r": "Warangal Rural", "warangal u": "Warangal Urban", "yadadri": "Yadadri Bhuvanagiri",
}


def multi_name(value):
    clean = " ".join((value or "").replace("(", " ").replace(")", " ").split()).lower()
    return MULTI_NAME_ALIASES.get(clean, clean.title())


def multi_number(value):
    try:
        return int(float(str(value or "0").replace(",", "").strip()))
    except ValueError:
        return 0


def first_existing(paths):
    return next((Path(path) for path in paths if Path(path).exists()), None)


def multi_year_payload():
    """Build an API payload directly from the supplied year-labelled CSVs.

    No missing values are interpolated: a metric is null when that year has no
    corresponding source file.
    """
    annual, by_year = [], {}
    for year, sources in settings.EDUCATION_MULTI_YEAR_FILES.items():
        school_path, college_path = first_existing(sources.get("schools", [])), first_existing(sources.get("colleges", []))
        districts, school_has_colleges = {}, False
        def district_for(raw_name):
            name = multi_name(raw_name)
            return districts.setdefault(name, {"name": name, "slug": slugify(name), "school_distribution": {}, "enrollment_distribution": {}, "college_distribution": {}, "college_seat_distribution": {}})
        if school_path:
            with school_path.open(encoding="utf-8-sig", newline="") as source:
                for row in csv.DictReader(source):
                    if not row.get("Districts"):
                        continue
                    item = district_for(row["Districts"])
                    if "Degree Colleges" in row:
                        school_has_colleges = True
                    for label, (count_field, enrollment_field) in MULTI_SCHOOL_FIELDS.items():
                        if count_field in row:
                            item["school_distribution"][label] = multi_number(row.get(count_field))
                        if enrollment_field and enrollment_field in row:
                            item["enrollment_distribution"][label] = multi_number(row.get(enrollment_field))
                    for label, (count_field, seats_field) in MULTI_COLLEGE_FIELDS.items():
                        if count_field in row:
                            item["college_distribution"][label] = multi_number(row.get(count_field))
                        if seats_field and seats_field in row:
                            item["college_seat_distribution"][label] = multi_number(row.get(seats_field))
        if college_path:
            with college_path.open(encoding="utf-8-sig", newline="") as source:
                for row in csv.DictReader(source):
                    if not row.get("Districts"):
                        continue
                    item = district_for(row["Districts"])
                    for label, (count_field, seats_field) in MULTI_COLLEGE_FIELDS.items():
                        if count_field in row:
                            item["college_distribution"][label] = multi_number(row.get(count_field))
                        if seats_field and seats_field in row:
                            item["college_seat_distribution"][label] = multi_number(row.get(seats_field))
        for item in districts.values():
            item["total_schools"] = sum(item["school_distribution"].values()) if school_path else None
            item["total_enrollment"] = sum(item["enrollment_distribution"].values()) if school_path else None
            item["total_colleges"] = sum(item["college_distribution"].values()) if (school_has_colleges or college_path) else None
            item["total_college_seats"] = sum(item["college_seat_distribution"].values()) if (school_has_colleges or college_path) else None
            item["literacy_rate"] = item["male_literacy_rate"] = item["female_literacy_rate"] = None
        rows = sorted(districts.values(), key=lambda item: item["name"])
        for index, item in enumerate(sorted([item for item in rows if item["total_enrollment"] is not None], key=lambda item: -item["total_enrollment"]), 1):
            item["state_rank"] = index
        availability = {"schools": bool(school_path), "enrollment": bool(school_path), "colleges": bool(school_has_colleges or college_path), "college_seats": bool(school_has_colleges or college_path), "literacy": False}
        total = lambda field: sum(item[field] or 0 for item in rows) if availability.get({"total_schools": "schools", "total_enrollment": "enrollment", "total_colleges": "colleges", "total_college_seats": "college_seats"}[field]) else None
        categories = lambda field: {key: sum(item[field].get(key, 0) for item in rows) for key in sorted({key for item in rows for key in item[field]})}
        summary = {"year": year, "district_count": len(rows), "availability": availability, "total_schools": total("total_schools"), "total_enrollment": total("total_enrollment"), "total_colleges": total("total_colleges"), "total_college_seats": total("total_college_seats"), "school_categories": categories("school_distribution"), "college_categories": categories("college_distribution"), "districts": rows}
        annual.append(summary)
        by_year[year] = summary
    return {"years": [item["year"] for item in annual], "annual": annual, "by_year": by_year, "literacy_note": "No year-labelled literacy dataset was supplied, so literacy is not calculated or displayed."}


def education_score(district, maxima):
    """Balanced, explainable 100-point score based only on the supplied fields."""
    def share(value, key):
        return value / maxima[key] if maxima[key] else 0
    score = (
        share(district.literacy_rate, "literacy_rate") * 40
        + share(district.total_schools, "total_schools") * 15
        + share(district.total_enrollment, "total_enrollment") * 20
        + share(district.total_colleges, "total_colleges") * 15
        + share(district.engineering_college_seats, "engineering_college_seats") * 10
    )
    return round(score, 1)


def district_maxima(districts):
    return {
        "literacy_rate": max((d.literacy_rate for d in districts), default=0),
        "total_schools": max((d.total_schools for d in districts), default=0),
        "total_enrollment": max((d.total_enrollment for d in districts), default=0),
        "total_colleges": max((d.total_colleges for d in districts), default=0),
        "engineering_college_seats": max((d.engineering_college_seats for d in districts), default=0),
    }


def serialize(district, rank=None, score=None):
    return {
        "name": district.name, "slug": district.slug,
        "male_literate": district.male_literate, "female_literate": district.female_literate,
        "male_literacy_rate": district.male_literacy_rate,
        "female_literacy_rate": district.female_literacy_rate,
        "literacy_rate": district.literacy_rate,
        "total_schools": district.total_schools, "total_enrollment": district.total_enrollment,
        "total_colleges": district.total_colleges, "total_college_seats": district.total_college_seats,
        "engineering_colleges": district.engineering_colleges,
        "degree_colleges": district.degree_colleges,
        "engineering_college_seats": district.engineering_college_seats,
        "school_distribution": {
            "Primary": district.primary_schools, "Upper primary": district.upper_primary_schools,
            "High": district.high_schools, "Model": district.model_schools,
            "KGBV": district.kgbv_schools, "Central": district.central_schools,
        },
        "enrollment_distribution": {
            "Primary": district.primary_enrollment, "Upper primary": district.upper_primary_enrollment,
            "High": district.high_enrollment, "Model": district.model_enrollment,
            "KGBV": district.kgbv_enrollment, "Central": district.central_enrollment,
        },
        "college_distribution": {
            "Junior": district.junior_colleges, "Degree": district.degree_colleges,
            "Engineering": district.engineering_colleges, "Pharmacy": district.pharmacy_colleges,
            "MBA": district.mba_colleges, "MCA": district.mca_colleges,
            "B.Ed.": district.bed_colleges, "Law": district.law_colleges,
        },
        "college_seat_distribution": {
            "Degree": district.degree_college_seats, "Engineering": district.engineering_college_seats,
            "Pharmacy": district.pharmacy_college_seats, "MBA": district.mba_college_seats,
            "MCA": district.mca_college_seats, "B.Ed.": district.bed_college_seats,
            "Law": district.law_college_seats,
        },
        "state_rank": rank,
        "education_score": score,
    }


def ranked_districts():
    return list(EducationDistrict.objects.order_by("-literacy_rate", "name"))


@api_view(["GET"])
def district_list(request):
    ranked = ranked_districts()
    maxima = district_maxima(ranked)
    return Response([serialize(district, index + 1, education_score(district, maxima)) for index, district in enumerate(ranked)])


@api_view(["GET"])
def district_detail(request, slug):
    ranked = ranked_districts()
    maxima = district_maxima(ranked)
    enrollment_rank = {district.id: index for index, district in enumerate(sorted(ranked, key=lambda item: (-item.total_enrollment, item.name)), start=1)}
    college_rank = {district.id: index for index, district in enumerate(sorted(ranked, key=lambda item: (-item.total_colleges, item.name)), start=1)}
    averages = {
        "literacy_rate": round(sum(d.literacy_rate for d in ranked) / len(ranked), 2) if ranked else 0,
        "total_schools": round(sum(d.total_schools for d in ranked) / len(ranked), 2) if ranked else 0,
        "total_enrollment": round(sum(d.total_enrollment for d in ranked) / len(ranked), 2) if ranked else 0,
        "total_colleges": round(sum(d.total_colleges for d in ranked) / len(ranked), 2) if ranked else 0,
        "engineering_college_seats": round(sum(d.engineering_college_seats for d in ranked) / len(ranked), 2) if ranked else 0,
    }
    for index, district in enumerate(ranked, start=1):
        if district.slug == slug:
            payload = serialize(district, index, education_score(district, maxima))
            payload["ranks"] = {"literacy": index, "enrollment": enrollment_rank[district.id], "colleges": college_rank[district.id]}
            payload["state_averages"] = averages
            payload["district_count"] = len(ranked)
            return Response(payload)
    return Response({"detail": "Education district not found."}, status=404)


@api_view(["GET"])
def overview(request):
    ranked = ranked_districts()
    maxima = district_maxima(ranked)
    payload = [serialize(district, index + 1, education_score(district, maxima)) for index, district in enumerate(ranked)]
    total = lambda field: sum(getattr(district, field) for district in ranked)
    male_literate, female_literate = total("male_literate"), total("female_literate")
    male_population = sum(d.male_literate / (d.male_literacy_rate / 100) for d in ranked if d.male_literacy_rate)
    female_population = sum(d.female_literate / (d.female_literacy_rate / 100) for d in ranked if d.female_literacy_rate)
    return Response({
        "district_count": len(payload), "total_schools": sum(d.total_schools for d in ranked),
        "total_colleges": sum(d.total_colleges for d in ranked),
        "total_enrollment": sum(d.total_enrollment for d in ranked),
        "male_literacy_rate": round(male_literate / male_population * 100, 2) if male_population else 0,
        "female_literacy_rate": round(female_literate / female_population * 100, 2) if female_population else 0,
        "districts": payload,
    })


@api_view(["GET"])
def multi_year_overview(request):
    return Response(multi_year_payload())


def serialize_dropout(record, rank=None):
    return {
        "name": record.name,
        "slug": record.slug,
        "primary_enrollment": record.primary_enrollment,
        "upper_primary_enrollment": record.upper_primary_enrollment,
        "high_school_enrollment": record.high_school_enrollment,
        "primary_dropout_rate": record.primary_dropout_rate,
        "upper_primary_dropout_rate": record.upper_primary_dropout_rate,
        "high_school_dropout_rate": record.high_school_dropout_rate,
        "estimated_primary_dropouts": record.estimated_primary_dropouts,
        "estimated_upper_primary_dropouts": record.estimated_upper_primary_dropouts,
        "estimated_high_school_dropouts": record.estimated_high_school_dropouts,
        "dropout_rate": round((record.primary_dropout_rate + record.upper_primary_dropout_rate + record.high_school_dropout_rate) / 3, 2),
        "dropout_rank": rank,
        "data_year": record.data_year,
        "data_source": record.data_source,
        "count_note": record.count_note,
    }


@api_view(["GET"])
def dropout_overview(request):
    records = list(EducationDropout.objects.all())
    ranked = sorted(records, key=lambda record: (-record.high_school_dropout_rate, record.name))
    payload = [serialize_dropout(record, index) for index, record in enumerate(ranked, start=1)]
    total = lambda field: sum(getattr(record, field) or 0 for record in records)
    rate_average = lambda field: round(sum(getattr(record, field) for record in records) / len(records), 2) if records else 0
    return Response({
        "district_count": len(records),
        "estimated_primary_dropouts": total("estimated_primary_dropouts"),
        "estimated_upper_primary_dropouts": total("estimated_upper_primary_dropouts"),
        "estimated_high_school_dropouts": total("estimated_high_school_dropouts"),
        "primary_dropout_rate": rate_average("primary_dropout_rate"),
        "upper_primary_dropout_rate": rate_average("upper_primary_dropout_rate"),
        "high_school_dropout_rate": rate_average("high_school_dropout_rate"),
        "districts": payload,
    })
