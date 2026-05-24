"""Vercel Python Function entrypoint for the FastAPI backend."""
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402
