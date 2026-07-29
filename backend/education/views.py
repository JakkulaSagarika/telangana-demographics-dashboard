from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import EducationDistrict


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
