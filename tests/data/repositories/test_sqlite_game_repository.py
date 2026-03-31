from backend.data.repositories.sqlite_game_repository import SqliteGameRepository


class TestSqliteGameRepository:
    def test_upsert_creates_new_game(self, game_repo: SqliteGameRepository) -> None:
        game = game_repo.upsert_by_bgg_id(
            bgg_id=13,
            name="Catan",
            thumbnail_url="https://example.com/catan.jpg",
            year_published=1995,
        )
        assert game.bgg_id == 13
        assert game.name == "Catan"
        assert game.year_published == 1995

    def test_upsert_updates_existing_game(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://old.jpg", 1995)
        updated = game_repo.upsert_by_bgg_id(13, "Catan: 25th Anniversary", "https://new.jpg", 1995)
        assert updated.name == "Catan: 25th Anniversary"
        assert updated.thumbnail_url == "https://new.jpg"

    def test_get_by_id(self, game_repo: SqliteGameRepository) -> None:
        created = game_repo.upsert_by_bgg_id(13, "Catan", "https://example.com/catan.jpg", 1995)
        found = game_repo.get_by_id(created.id)
        assert found is not None
        assert found.bgg_id == 13

    def test_get_by_id_not_found(self, game_repo: SqliteGameRepository) -> None:
        assert game_repo.get_by_id(999) is None

    def test_get_by_bgg_id(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(13, "Catan", "https://example.com/catan.jpg", 1995)
        found = game_repo.get_by_bgg_id(13)
        assert found is not None
        assert found.name == "Catan"

    def test_list_all_sorted_by_name(self, game_repo: SqliteGameRepository) -> None:
        game_repo.upsert_by_bgg_id(1, "Zombicide", "https://z.jpg", 2012)
        game_repo.upsert_by_bgg_id(2, "Azul", "https://a.jpg", 2017)
        game_repo.upsert_by_bgg_id(3, "Catan", "https://c.jpg", 1995)
        games = game_repo.list_all()
        names = [g.name for g in games]
        assert names == ["Azul", "Catan", "Zombicide"]
