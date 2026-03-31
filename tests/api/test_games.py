from __future__ import annotations

import sqlite3

from fastapi.testclient import TestClient

from backend.api.app import create_app
from backend.api.dependencies import get_db_conn
from backend.data.database import get_memory_connection
from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
from backend.data.repositories.sqlite_loan_repository import SqliteLoanRepository
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.migrations.runner import run_migrations


def _setup_client() -> tuple[TestClient, sqlite3.Connection]:
    conn = get_memory_connection()
    conn.close()
    # Re-open with check_same_thread=False so FastAPI's threadpool can use it
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    conn.row_factory = sqlite3.Row
    run_migrations(conn)

    app = create_app()

    def override_db_conn():  # type: ignore[no-untyped-def]
        yield conn

    app.dependency_overrides[get_db_conn] = override_db_conn
    client = TestClient(app)
    return client, conn


class TestListGames:
    def test_empty_catalog(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/games")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_games_with_status(self) -> None:
        client, conn = _setup_client()

        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game1 = game_repo.upsert_by_bgg_id(
            bgg_id=100, name="Catan", thumbnail_url="https://example.com/catan.jpg", year_published=1995
        )
        game2 = game_repo.upsert_by_bgg_id(
            bgg_id=200, name="Pandemic", thumbnail_url="https://example.com/pandemic.jpg", year_published=2008
        )

        member = member_repo.upsert_by_email(
            member_number=1,
            first_name="Alice",
            last_name="Smith",
            nickname=None,
            phone=None,
            email="alice@example.com",
            display_name="Alice Smith",
            is_admin=False,
        )

        loan_repo.create(game_id=game2.id, member_id=member.id)

        response = client.get("/api/games")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        by_name = {g["name"]: g for g in data}

        assert by_name["Catan"]["status"] == "available"
        assert by_name["Catan"]["borrower_display_name"] is None
        assert by_name["Catan"]["loan_id"] is None

        assert by_name["Pandemic"]["status"] == "lent"
        assert by_name["Pandemic"]["borrower_display_name"] == "Alice Smith"
        assert by_name["Pandemic"]["loan_id"] is not None

        conn.close()


class TestGetGameHistory:
    def test_empty_history(self) -> None:
        client, conn = _setup_client()

        response = client.get("/api/games/999/history")

        assert response.status_code == 200
        assert response.json() == []
        conn.close()

    def test_game_with_history(self) -> None:
        client, conn = _setup_client()

        game_repo = SqliteGameRepository(conn)
        member_repo = SqliteMemberRepository(conn)
        loan_repo = SqliteLoanRepository(conn)

        game = game_repo.upsert_by_bgg_id(
            bgg_id=100, name="Catan", thumbnail_url="https://example.com/catan.jpg", year_published=1995
        )

        alice = member_repo.upsert_by_email(
            member_number=1,
            first_name="Alice",
            last_name="Smith",
            nickname=None,
            phone=None,
            email="alice@example.com",
            display_name="Alice Smith",
            is_admin=False,
        )

        bob = member_repo.upsert_by_email(
            member_number=2,
            first_name="Bob",
            last_name="Jones",
            nickname=None,
            phone=None,
            email="bob@example.com",
            display_name="Bob Jones",
            is_admin=False,
        )

        # Alice borrowed and returned
        loan1 = loan_repo.create(game_id=game.id, member_id=alice.id)
        loan_repo.mark_returned(loan1.id)

        # Bob currently has it
        loan_repo.create(game_id=game.id, member_id=bob.id)

        response = client.get(f"/api/games/{game.id}/history")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Most recent first
        assert data[0]["member_display_name"] == "Bob Jones"
        assert data[0]["returned_at"] is None

        assert data[1]["member_display_name"] == "Alice Smith"
        assert data[1]["returned_at"] is not None

        conn.close()
