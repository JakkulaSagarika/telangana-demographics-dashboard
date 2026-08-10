from django.urls import path
from . import views

urlpatterns = [
    path("overview/", views.overview, name="ev-overview"),
    path("stations/", views.station_list, name="ev-station-list"),
    path("stations/<slug:slug>/", views.station_detail, name="ev-station-detail"),
]
