from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    db_path: str = os.environ.get("PRESTECS_DB_PATH", "prestecs.db")
    jwt_secret: str = os.environ.get("PRESTECS_JWT_SECRET", "dev-secret-change-in-production-minimum-32-bytes")
    base_url: str = os.environ.get("PRESTECS_BASE_URL", "http://localhost:8000")
