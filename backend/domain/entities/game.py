from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Game:
    id: int
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int
    created_at: datetime
    updated_at: datetime
