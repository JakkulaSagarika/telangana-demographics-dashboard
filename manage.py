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
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
