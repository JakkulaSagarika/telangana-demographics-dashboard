"""First-run database setup for the bundled dashboard data."""

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db.utils import OperationalError, ProgrammingError

from .models import District


def seed_default_data(sender, apps, stdout, **kwargs):
    """Import the repository workbook after migrations when no districts exist."""
    try:
        if District.objects.exists():
            return
    except (OperationalError, ProgrammingError):
        # The demographics tables are not available yet; a later post_migrate
        # signal for this app will perform the import.
        return

    workbook = settings.DEFAULT_WORKBOOK_PATH
    if not workbook.is_file():
        stdout.write(
            f"Dashboard data was not imported: workbook not found at {workbook}."
        )
        return

    try:
        call_command("import_birth_death_workbook", workbook, stdout=stdout, verbosity=0)
    except CommandError as error:
        stdout.write(f"Dashboard data was not imported: {error}")
