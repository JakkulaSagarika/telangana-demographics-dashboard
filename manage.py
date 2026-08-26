#!/usr/bin/env python
"""Cross-platform Django entry point for running commands from the repository root."""

import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


def main():
    try:
        from django.core.management import execute_from_command_line
    except ImportError as error:
        raise ImportError(
            "Django is unavailable. Activate your virtual environment and run "
            "'pip install -r requirements.txt'."
        ) from error
    # `runserver` is the normal backend startup command documented below.  Run
    # migrations first so a fresh clone receives SQLite tables and bundled data
    # without a separate import or seed command.  The post_migrate receivers
    # use idempotent update_or_create imports.
    if len(sys.argv) > 1 and sys.argv[1] == "runserver" and os.environ.get("RUN_MAIN") != "true":
        import django
        from django.core.management import call_command
        django.setup()
        call_command("migrate", interactive=False, verbosity=0)
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
