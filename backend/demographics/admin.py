from django.contrib import admin
from .models import District


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "population_total", "births", "deaths", "collector_name")
    search_fields = ("name", "collector_name")
    prepopulated_fields = {"slug": ("name",)}
