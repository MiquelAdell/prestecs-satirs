from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Loan:
    id: int
    game_id: int
    member_id: int
    borrowed_at: datetime
    returned_at: datetime | None
