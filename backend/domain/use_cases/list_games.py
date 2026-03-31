from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from backend.domain.entities.game import Game
from backend.domain.repositories.game_repository import GameRepository
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository


@dataclass(frozen=True)
class GameWithStatus:
    id: int
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int
    min_players: int
    max_players: int
    playing_time: int
    bgg_rating: float
    location: str
    created_at: datetime
    updated_at: datetime
    status: str  # "available" or "lent"
    borrower_display_name: str | None
    loan_id: int | None


class ListGamesUseCase:
    def __init__(
        self,
        game_repo: GameRepository,
        loan_repo: LoanRepository,
        member_repo: MemberRepository,
    ) -> None:
        self._game_repo = game_repo
        self._loan_repo = loan_repo
        self._member_repo = member_repo

    def execute(self) -> list[GameWithStatus]:
        games = self._game_repo.list_all()
        result: list[GameWithStatus] = []

        for game in games:
            active_loan = self._loan_repo.get_active_by_game_id(game.id)

            if active_loan is not None:
                member = self._member_repo.get_by_id(active_loan.member_id)
                borrower_display_name = member.display_name if member else None
                result.append(
                    GameWithStatus(
                        id=game.id,
                        bgg_id=game.bgg_id,
                        name=game.name,
                        thumbnail_url=game.thumbnail_url,
                        year_published=game.year_published,
                        min_players=game.min_players,
                        max_players=game.max_players,
                        playing_time=game.playing_time,
                        bgg_rating=game.bgg_rating,
                        location=game.location,
                        created_at=game.created_at,
                        updated_at=game.updated_at,
                        status="lent",
                        borrower_display_name=borrower_display_name,
                        loan_id=active_loan.id,
                    )
                )
            else:
                result.append(
                    GameWithStatus(
                        id=game.id,
                        bgg_id=game.bgg_id,
                        name=game.name,
                        thumbnail_url=game.thumbnail_url,
                        year_published=game.year_published,
                        min_players=game.min_players,
                        max_players=game.max_players,
                        playing_time=game.playing_time,
                        bgg_rating=game.bgg_rating,
                        location=game.location,
                        created_at=game.created_at,
                        updated_at=game.updated_at,
                        status="available",
                        borrower_display_name=None,
                        loan_id=None,
                    )
                )

        return result
