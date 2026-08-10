from django.apps import AppConfig


class EvConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ev"

    def ready(self):
        from . import signals  # noqa: F401
