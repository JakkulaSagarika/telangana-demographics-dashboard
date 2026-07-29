from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def seed_education_data(sender, **kwargs):
    if sender.name != "education":
        return
    from .models import EducationDistrict
    if EducationDistrict.objects.exists():
        return
    if not (settings.EDUCATION_LITERACY_CSV_PATH.exists() and settings.EDUCATION_SCHOOLS_CSV_PATH.exists()):
        return
    from .management.commands.import_education_data import import_education_data
    import_education_data(settings.EDUCATION_LITERACY_CSV_PATH, settings.EDUCATION_SCHOOLS_CSV_PATH)
