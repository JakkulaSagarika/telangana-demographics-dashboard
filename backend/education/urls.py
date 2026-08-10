from django.urls import path
from . import views

urlpatterns = [
    path("overview/", views.overview, name="education-overview"),
    path("dropout/", views.dropout_overview, name="education-dropout-overview"),
    path("districts/", views.district_list, name="education-district-list"),
    path("districts/<slug:slug>/", views.district_detail, name="education-district-detail"),
]
