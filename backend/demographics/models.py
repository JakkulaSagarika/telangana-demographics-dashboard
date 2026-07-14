from django.db import models


class District(models.Model):
    """One row per Telangana district; populated from the project Excel file."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    population_total = models.PositiveBigIntegerField(default=0)
    population_male = models.PositiveBigIntegerField(default=0)
    population_female = models.PositiveBigIntegerField(default=0)
    area_sq_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    births = models.PositiveIntegerField(default=0)
    births_male = models.PositiveIntegerField(default=0)
    births_female = models.PositiveIntegerField(default=0)
    deaths = models.PositiveIntegerField(default=0)
    deaths_male = models.PositiveIntegerField(default=0)
    deaths_female = models.PositiveIntegerField(default=0)
    gram_panchayat_births = models.PositiveIntegerField(default=0)
    gram_panchayat_deaths = models.PositiveIntegerField(default=0)
    municipality_births = models.PositiveIntegerField(default=0)
    municipality_deaths = models.PositiveIntegerField(default=0)
    corporation_births = models.PositiveIntegerField(default=0)
    corporation_deaths = models.PositiveIntegerField(default=0)
    gram_panchayats = models.PositiveIntegerField(default=0)
    municipalities = models.PositiveIntegerField(default=0)
    municipal_corporations = models.PositiveIntegerField(default=0)
    urban_population = models.PositiveBigIntegerField(default=0)
    collector_name = models.CharField(max_length=150, blank=True)
    state_contribution_percent = models.DecimalField(max_digits=6, decimal_places=3, default=0)
    source_year = models.PositiveSmallIntegerField(default=2025)
    facts = models.TextField(blank=True, help_text="One interesting fact per line")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class LocalBody(models.Model):
    class BodyType(models.TextChoices):
        GRAM_PANCHAYAT = "gram_panchayat", "Gram Panchayat"
        MUNICIPALITY = "municipality", "Municipality"
        CORPORATION = "corporation", "Municipal Corporation"

    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="local_bodies")
    name = models.CharField(max_length=255)
    body_type = models.CharField(max_length=20, choices=BodyType.choices)
    births = models.PositiveIntegerField(default=0)
    deaths = models.PositiveIntegerField(default=0)
    births_male = models.PositiveIntegerField(default=0)
    births_female = models.PositiveIntegerField(default=0)
    deaths_male = models.PositiveIntegerField(default=0)
    deaths_female = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["district", "body_type", "name"], name="unique_local_body")]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_body_type_display()})"
