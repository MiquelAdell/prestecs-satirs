from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository


@dataclass(frozen=True)
class LoanHistoryEntry:
    member_display_name: str
    borrowed_at: datetime
    returned_at: datetime | None


class GetGameHistoryUseCase:
    def __init__(
        self,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._loan_repo = loan_repo
        self._member_repo = member_repo

    def execute(self, game_id: int) -> list[LoanHistoryEntry]:
        loans = self._loan_repo.list_by_game_id(game_id)
        result: list[LoanHistoryEntry] = []

        for loan in loans:
            member = self._member_repo.get_by_id(loan.member_id)
            display_name = member.display_name if member else "Unknown"
            result.append(
                LoanHistoryEntry(
                    member_display_name=display_name,
                    borrowed_at=loan.borrowed_at,
                    returned_at=loan.returned_at,
                )
            )

        return result
