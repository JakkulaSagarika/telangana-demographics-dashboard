from django.apps import AppConfig


class DemographicsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = 'demographics'

    def ready(self):
        from django.db.models.signals import post_migrate
        from .signals import seed_default_data

        post_migrate.connect(seed_default_data, sender=self)
