from collections import Counter

from django.db.models import Count, Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import EVChargingStation


def serialize(station):
    return {
        "id": station.id,
        "name": station.station_name,
        "slug": station.slug,
        "state": station.state,
        "district": station.district,
        "address": station.address,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "owner_organization": station.owner_organization,
    }


@api_view(["GET"])
def station_list(request):
    stations = EVChargingStation.objects.all()
    district = request.query_params.get("district", "").strip()
    owner = request.query_params.get("owner", "").strip()
    if district:
        stations = stations.filter(district__iexact=district)
    if owner:
        stations = stations.filter(owner_organization__icontains=owner)
    return Response([serialize(station) for station in stations])


@api_view(["GET"])
def station_detail(request, slug):
    try:
        station = EVChargingStation.objects.get(slug=slug)
    except EVChargingStation.DoesNotExist:
        return Response({"detail": "EV station not found."}, status=404)
    return Response(serialize(station))


@api_view(["GET"])
def overview(request):
    stations = list(EVChargingStation.objects.all())

    # District-wise station counts
    district_counts = Counter(
        station.district
        for station in stations
        if station.district
    )

    # Operator-wise station counts
    owner_counts = Counter(
        station.owner_organization
        for station in stations
        if station.owner_organization
    )

    # Operator-wise district distribution
    owner_districts = {}

    for station in stations:
        owner = station.owner_organization
        district = station.district

        if not owner or not district:
            continue

        if owner not in owner_districts:
            owner_districts[owner] = Counter()

        owner_districts[owner][district] += 1

    # Build operator analytics data
    owners = []

    for owner, station_count in owner_counts.most_common():
        district_distribution = [
            {
                "name": district,
                "station_count": count,
            }
            for district, count
            in owner_districts.get(owner, Counter()).most_common()
        ]

        owners.append({
            "name": owner,
            "station_count": station_count,
            "district_count": len(district_distribution),
            "districts": district_distribution,
        })

    return Response({
        "station_count": len(stations),
        "district_count": len(district_counts),
        "owner_count": len(owner_counts),

        "districts": [
            {
                "name": district,
                "station_count": count,
            }
            for district, count in district_counts.most_common()
        ],

        "owners": owners,
    })
