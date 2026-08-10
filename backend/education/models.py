from django.db import models


class EducationDistrict(models.Model):
    """Education data imported independently from the two supplied CSV datasets."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)

    male_literate = models.PositiveIntegerField(default=0)
    female_literate = models.PositiveIntegerField(default=0)
    male_literacy_rate = models.FloatField(default=0)
    female_literacy_rate = models.FloatField(default=0)
    literacy_rate = models.FloatField(default=0)

    primary_schools = models.PositiveIntegerField(default=0)
    primary_enrollment = models.PositiveIntegerField(default=0)
    upper_primary_schools = models.PositiveIntegerField(default=0)
    upper_primary_enrollment = models.PositiveIntegerField(default=0)
    high_schools = models.PositiveIntegerField(default=0)
    high_enrollment = models.PositiveIntegerField(default=0)
    model_schools = models.PositiveIntegerField(default=0)
    model_enrollment = models.PositiveIntegerField(default=0)
    kgbv_schools = models.PositiveIntegerField(default=0)
    kgbv_enrollment = models.PositiveIntegerField(default=0)
    central_schools = models.PositiveIntegerField(default=0)
    central_enrollment = models.PositiveIntegerField(default=0)

    junior_colleges = models.PositiveIntegerField(default=0)
    degree_colleges = models.PositiveIntegerField(default=0)
    degree_college_seats = models.PositiveIntegerField(default=0)
    engineering_colleges = models.PositiveIntegerField(default=0)
    engineering_college_seats = models.PositiveIntegerField(default=0)
    pharmacy_colleges = models.PositiveIntegerField(default=0)
    pharmacy_college_seats = models.PositiveIntegerField(default=0)
    mba_colleges = models.PositiveIntegerField(default=0)
    mba_college_seats = models.PositiveIntegerField(default=0)
    mca_colleges = models.PositiveIntegerField(default=0)
    mca_college_seats = models.PositiveIntegerField(default=0)
    bed_colleges = models.PositiveIntegerField(default=0)
    bed_college_seats = models.PositiveIntegerField(default=0)
    law_colleges = models.PositiveIntegerField(default=0)
    law_college_seats = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("name",)

    @property
    def total_schools(self):
        return sum((self.primary_schools, self.upper_primary_schools, self.high_schools,
                    self.model_schools, self.kgbv_schools, self.central_schools))

    @property
    def total_enrollment(self):
        return sum((self.primary_enrollment, self.upper_primary_enrollment, self.high_enrollment,
                    self.model_enrollment, self.kgbv_enrollment, self.central_enrollment))

    @property
    def total_colleges(self):
        return sum((self.junior_colleges, self.degree_colleges, self.engineering_colleges,
                    self.pharmacy_colleges, self.mba_colleges, self.mca_colleges,
                    self.bed_colleges, self.law_colleges))

    @property
    def total_college_seats(self):
        return sum((self.degree_college_seats, self.engineering_college_seats,
                    self.pharmacy_college_seats, self.mba_college_seats,
                    self.mca_college_seats, self.bed_college_seats, self.law_college_seats))


class EducationDropout(models.Model):
    """District-level dropout measures sourced only from the uploaded 2021-22 CSV."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    primary_enrollment = models.PositiveIntegerField(default=0)
    upper_primary_enrollment = models.PositiveIntegerField(default=0)
    high_school_enrollment = models.PositiveIntegerField(default=0)
    primary_dropout_rate = models.FloatField(default=0)
    upper_primary_dropout_rate = models.FloatField(default=0)
    high_school_dropout_rate = models.FloatField(default=0)
    estimated_primary_dropouts = models.PositiveIntegerField(null=True, blank=True)
    estimated_upper_primary_dropouts = models.PositiveIntegerField(null=True, blank=True)
    estimated_high_school_dropouts = models.PositiveIntegerField(null=True, blank=True)
    data_year = models.CharField(max_length=20)
    data_source = models.CharField(max_length=255)
    count_note = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)
