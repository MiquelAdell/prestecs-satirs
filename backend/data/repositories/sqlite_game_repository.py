from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from backend.domain.entities.game import Game


def _row_to_game(row: sqlite3.Row) -> Game:
    return Game(
        id=row["id"],
        bgg_id=row["bgg_id"],
        name=row["name"],
        thumbnail_url=row["thumbnail_url"],
        year_published=row["year_published"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


class SqliteGameRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_by_id(self, game_id: int) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE id = ?", (game_id,)
        ).fetchone()
        return _row_to_game(row) if row else None

    def get_by_bgg_id(self, bgg_id: int) -> Game | None:
        row = self._conn.execute(
            "SELECT * FROM games WHERE bgg_id = ?", (bgg_id,)
        ).fetchone()
        return _row_to_game(row) if row else None

    def list_all(self) -> list[Game]:
        rows = self._conn.execute("SELECT * FROM games ORDER BY name").fetchall()
        return [_row_to_game(row) for row in rows]

    def upsert_by_bgg_id(
        self,
        bgg_id: int,
        name: str,
        thumbnail_url: str,
        year_published: int,
    ) -> Game:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            """
            INSERT INTO games (bgg_id, name, thumbnail_url, year_published, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(bgg_id) DO UPDATE SET
                name = excluded.name,
                thumbnail_url = excluded.thumbnail_url,
                year_published = excluded.year_published,
                updated_at = ?
            """,
            (bgg_id, name, thumbnail_url, year_published, now, now, now),
        )
        self._conn.commit()
        game = self.get_by_bgg_id(bgg_id)
        assert game is not None
        return game
