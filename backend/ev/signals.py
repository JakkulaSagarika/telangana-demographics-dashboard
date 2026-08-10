from django.conf import settings
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def seed_ev_data(sender, **kwargs):
    if sender.name != "ev":
        return
    from .models import EVChargingStation
    if EVChargingStation.objects.exists():
        return
    if not settings.EV_CHARGING_STATIONS_CSV_PATH.exists():
        return
    from .management.commands.import_ev_data import import_ev_data
    import_ev_data(settings.EV_CHARGING_STATIONS_CSV_PATH)
