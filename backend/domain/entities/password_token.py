from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class PasswordToken:
    id: int
    token: str
    member_id: int
    created_at: datetime
    expires_at: datetime
    used_at: datetime | None
