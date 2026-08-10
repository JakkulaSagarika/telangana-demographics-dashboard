from django.db import models
from django.utils.text import slugify


class EVChargingStation(models.Model):
    station_name = models.CharField(max_length=255)
    state = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=120, blank=True)
    address = models.TextField(blank=True)
    latitude = models.FloatField(default=0)
    longitude = models.FloatField(default=0)
    owner_organization = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("district", "station_name")
        verbose_name = "EV charging station"
        verbose_name_plural = "EV charging stations"

    def ensure_unique_slug(self):
        if not self.slug:
            self.slug = slugify(self.station_name)
        base_slug = self.slug
        candidate = self.slug
        suffix = 2
        while EVChargingStation.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base_slug}-{suffix}"
            suffix += 1
        self.slug = candidate

    def save(self, *args, **kwargs):
        self.ensure_unique_slug()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.station_name
