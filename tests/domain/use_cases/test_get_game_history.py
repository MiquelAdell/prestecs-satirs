from __future__ import annotations

from datetime import UTC, datetime

from backend.domain.entities.loan import Loan
from backend.domain.entities.member import Member
from backend.domain.use_cases.get_game_history import GetGameHistoryUseCase


# ── Fake repositories ──────────────────────────────────────────────


class FakeLoanRepository:
    def __init__(self, loans: list[Loan] | None = None) -> None:
        self._loans: list[Loan] = loans or []

    def get_by_id(self, loan_id: int) -> Loan | None:
        return next((lo for lo in self._loans if lo.id == loan_id), None)

    def get_active_by_game_id(self, game_id: int) -> Loan | None:
        return next(
            (lo for lo in self._loans if lo.game_id == game_id and lo.returned_at is None),
            None,
        )

    def list_active_by_member_id(self, member_id: int) -> list[Loan]:
        return [lo for lo in self._loans if lo.member_id == member_id and lo.returned_at is None]

    def list_by_game_id(self, game_id: int) -> list[Loan]:
        return sorted(
            [lo for lo in self._loans if lo.game_id == game_id],
            key=lambda lo: lo.borrowed_at,
            reverse=True,
        )

    def create(self, game_id: int, member_id: int) -> Loan:
        raise NotImplementedError

    def mark_returned(self, loan_id: int) -> Loan:
        raise NotImplementedError


class FakeMemberRepository:
    def __init__(self, members: list[Member] | None = None) -> None:
        self._members: dict[int, Member] = {m.id: m for m in (members or [])}

    def get_by_id(self, member_id: int) -> Member | None:
        return self._members.get(member_id)

    def get_by_email(self, email: str) -> Member | None:
        return next((m for m in self._members.values() if m.email == email), None)

    def list_all(self) -> list[Member]:
        return list(self._members.values())

    def upsert_by_email(self, **kwargs: object) -> Member:
        raise NotImplementedError

    def update_display_name(self, member_id: int, display_name: str) -> None:
        raise NotImplementedError

    def set_password_hash(self, member_id: int, password_hash: str) -> None:
        raise NotImplementedError


# ── Helpers ─────────────────────────────────────────────────────────

NOW = datetime.now(UTC)


def _make_member(id: int, display_name: str) -> Member:
    return Member(
        id=id,
        member_number=id,
        first_name="First",
        last_name="Last",
        nickname=None,
        phone=None,
        email=f"member{id}@example.com",
        display_name=display_name,
        password_hash=None,
        is_admin=False,
        created_at=NOW,
        updated_at=NOW,
    )


def _make_loan(
    id: int,
    game_id: int,
    member_id: int,
    borrowed_at: datetime,
    returned_at: datetime | None = None,
) -> Loan:
    return Loan(
        id=id,
        game_id=game_id,
        member_id=member_id,
        borrowed_at=borrowed_at,
        returned_at=returned_at,
    )


# ── Tests ───────────────────────────────────────────────────────────


class TestGetGameHistoryUseCase:
    def test_no_history(self) -> None:
        use_case = GetGameHistoryUseCase(
            loan_repo=FakeLoanRepository(),
            member_repo=FakeMemberRepository(),
        )

        result = use_case.execute(game_id=999)

        assert result == []

    def test_mixed_active_and_returned_loans(self) -> None:
        alice = _make_member(1, "Alice")
        bob = _make_member(2, "Bob")

        borrowed_earlier = datetime(2025, 1, 1, tzinfo=UTC)
        returned_date = datetime(2025, 1, 15, tzinfo=UTC)
        borrowed_later = datetime(2025, 2, 1, tzinfo=UTC)

        returned_loan = _make_loan(
            id=10,
            game_id=1,
            member_id=1,
            borrowed_at=borrowed_earlier,
            returned_at=returned_date,
        )
        active_loan = _make_loan(
            id=11,
            game_id=1,
            member_id=2,
            borrowed_at=borrowed_later,
        )

        use_case = GetGameHistoryUseCase(
            loan_repo=FakeLoanRepository([returned_loan, active_loan]),
            member_repo=FakeMemberRepository([alice, bob]),
        )

        result = use_case.execute(game_id=1)

        assert len(result) == 2

        # Most recent first
        assert result[0].member_display_name == "Bob"
        assert result[0].borrowed_at == borrowed_later
        assert result[0].returned_at is None

        assert result[1].member_display_name == "Alice"
        assert result[1].borrowed_at == borrowed_earlier
        assert result[1].returned_at == returned_date
