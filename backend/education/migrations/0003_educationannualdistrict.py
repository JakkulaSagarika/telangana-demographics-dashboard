from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("education", "0002_educationdropout")]

    operations = [
        migrations.CreateModel(
            name="EducationAnnualDistrict",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("year", models.CharField(max_length=20)),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=120)),
                ("total_schools", models.PositiveIntegerField(blank=True, null=True)),
                ("total_enrollment", models.PositiveIntegerField(blank=True, null=True)),
                ("total_colleges", models.PositiveIntegerField(blank=True, null=True)),
                ("total_college_seats", models.PositiveIntegerField(blank=True, null=True)),
                ("school_distribution", models.JSONField(default=dict)),
                ("enrollment_distribution", models.JSONField(default=dict)),
                ("college_distribution", models.JSONField(default=dict)),
                ("college_seat_distribution", models.JSONField(default=dict)),
            ],
            options={"ordering": ("year", "name")},
        ),
        migrations.AddConstraint(model_name="educationannualdistrict", constraint=models.UniqueConstraint(fields=("year", "slug"), name="education_annual_district_year_slug")),
    ]
