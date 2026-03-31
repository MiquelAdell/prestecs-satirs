from __future__ import annotations

from backend.api.auth import verify_password
from backend.domain.entities.member import Member
from backend.domain.repositories.member_repository import MemberRepository


class AuthenticateUseCase:
    def __init__(self, member_repo: MemberRepository) -> None:
        self._member_repo = member_repo

    def execute(self, email: str, password: str) -> Member | None:
        """Authenticate a member by email and password. Returns Member or None."""
        member = self._member_repo.get_by_email(email)
        if member is None:
            return None
        if not member.is_active:
            return None
        if member.password_hash is None:
            return None
        if not verify_password(password, member.password_hash):
            return None
        return member
