from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def seed_education_data(sender, **kwargs):
    if sender.name != "education":
        return
    if not (settings.EDUCATION_LITERACY_CSV_PATH.exists() and settings.EDUCATION_SCHOOLS_CSV_PATH.exists()):
        return
    from .management.commands.import_education_data import import_education_data
    # update_or_create in the importer makes this safe on every startup and
    # repairs an existing database with missing education records.
    import_education_data(settings.EDUCATION_LITERACY_CSV_PATH, settings.EDUCATION_SCHOOLS_CSV_PATH)
    from .views import import_multi_year_data
    import_multi_year_data()


@receiver(post_migrate)
def seed_dropout_data(sender, **kwargs):
    if sender.name != "education":
        return
    if not settings.EDUCATION_DROPOUT_CSV_PATH.exists():
        return
    from .management.commands.import_dropout_data import import_dropout_data
    # update_or_create makes the seed idempotent and fills any missing records.
    import_dropout_data(settings.EDUCATION_DROPOUT_CSV_PATH)
