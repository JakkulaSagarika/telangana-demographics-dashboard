from django.urls import path
from . import views

urlpatterns = [
    path("districts/", views.district_list, name="district-list"),
    path("districts/<slug:slug>/", views.district_detail, name="district-detail"),
    path("local-bodies/", views.local_body_list, name="local-body-list"),
    path("overview/", views.overview, name="overview"),
]
