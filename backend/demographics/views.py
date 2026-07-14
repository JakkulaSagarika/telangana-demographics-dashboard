from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import District


FIELDS = (
    "name", "slug", "population_total", "population_male", "population_female",
    "area_sq_km", "births", "births_male", "births_female", "deaths", "deaths_male", "deaths_female",
    "gram_panchayat_births", "gram_panchayat_deaths", "municipality_births", "municipality_deaths",
    "corporation_births", "corporation_deaths", "gram_panchayats", "municipalities",
    "municipal_corporations", "urban_population", "collector_name",
    "state_contribution_percent", "source_year", "facts", "updated_at",
)


def serialize(district):
    data = {field: getattr(district, field) for field in FIELDS}
    data["area_sq_km"] = float(data["area_sq_km"])
    data["state_contribution_percent"] = float(data["state_contribution_percent"])
    data["facts"] = [fact for fact in data["facts"].splitlines() if fact.strip()]
    return data


def serialize_local_body(body):
    return {
        "id": body.id, "name": body.name, "district": body.district.name, "district_slug": body.district.slug, "body_type": body.body_type,
        "births": body.births, "deaths": body.deaths,
        "births_male": body.births_male, "births_female": body.births_female,
        "deaths_male": body.deaths_male, "deaths_female": body.deaths_female,
    }


@api_view(["GET"])
def district_list(request):
    return Response([serialize(district) for district in District.objects.all()])


@api_view(["GET"])
def district_detail(request, slug):
    try:
        district = District.objects.get(slug=slug)
    except District.DoesNotExist:
        return Response({"detail": "District not found."}, status=404)
    data = serialize(district)
    data["local_bodies"] = [serialize_local_body(body) for body in district.local_bodies.all()]
    return Response(data)


@api_view(["GET"])
def local_body_list(request):
    body_type = request.query_params.get("type")
    bodies = District.objects.none()
    from .models import LocalBody
    bodies = LocalBody.objects.select_related("district").all()
    if body_type in {choice for choice, _ in LocalBody.BodyType.choices}:
        bodies = bodies.filter(body_type=body_type)
    return Response([serialize_local_body(body) for body in bodies])


@api_view(["GET"])
def overview(request):
    totals = District.objects.aggregate(
        population=Sum("population_total"), births=Sum("births"), deaths=Sum("deaths"),
        births_male=Sum("births_male"), births_female=Sum("births_female"),
        deaths_male=Sum("deaths_male"), deaths_female=Sum("deaths_female"),
    )
    return Response({
        "district_count": District.objects.count(),
        "population": totals["population"] or 0,
        "births": totals["births"] or 0,
        "deaths": totals["deaths"] or 0,
        "births_male": totals["births_male"] or 0,
        "births_female": totals["births_female"] or 0,
        "deaths_male": totals["deaths_male"] or 0,
        "deaths_female": totals["deaths_female"] or 0,
    })

# Create your views here.
