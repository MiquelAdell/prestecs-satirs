from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.api.dependencies import get_game_history_use_case, get_list_games_use_case
from backend.domain.use_cases.get_game_history import GetGameHistoryUseCase
from backend.domain.use_cases.list_games import ListGamesUseCase

router = APIRouter(prefix="/api/games", tags=["games"])


class GameResponse(BaseModel):
    id: int
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int
    created_at: datetime
    updated_at: datetime
    status: str
    borrower_display_name: str | None
    loan_id: int | None


class LoanHistoryEntryResponse(BaseModel):
    member_display_name: str
    borrowed_at: datetime
    returned_at: datetime | None


@router.get("", response_model=list[GameResponse])
def list_games(
    use_case: Annotated[ListGamesUseCase, Depends(get_list_games_use_case)],
) -> list[GameResponse]:
    games = use_case.execute()
    return [
        GameResponse(
            id=g.id,
            bgg_id=g.bgg_id,
            name=g.name,
            thumbnail_url=g.thumbnail_url,
            year_published=g.year_published,
            created_at=g.created_at,
            updated_at=g.updated_at,
            status=g.status,
            borrower_display_name=g.borrower_display_name,
            loan_id=g.loan_id,
        )
        for g in games
    ]


@router.get("/{game_id}/history", response_model=list[LoanHistoryEntryResponse])
def get_game_history(
    game_id: int,
    use_case: Annotated[GetGameHistoryUseCase, Depends(get_game_history_use_case)],
) -> list[LoanHistoryEntryResponse]:
    entries = use_case.execute(game_id)
    return [
        LoanHistoryEntryResponse(
            member_display_name=e.member_display_name,
            borrowed_at=e.borrowed_at,
            returned_at=e.returned_at,
        )
        for e in entries
    ]
