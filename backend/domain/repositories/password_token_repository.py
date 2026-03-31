from __future__ import annotations

from typing import Protocol

from backend.domain.entities.password_token import PasswordToken


class PasswordTokenRepository(Protocol):
    def create(self, member_id: int) -> PasswordToken: ...

    def get_by_token(self, token: str) -> PasswordToken | None: ...

    def mark_used(self, token_id: int) -> None: ...
