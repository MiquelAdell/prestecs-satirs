from __future__ import annotations

import typer

from backend.config import Settings
from backend.data.database import get_connection
from backend.migrations.runner import run_migrations

app = typer.Typer(name="game-lending", help="Prestecs Satyrs — game lending CLI")


def _get_settings() -> Settings:
    return Settings()


@app.command()
def migrate() -> None:
    """Run database migrations."""
    settings = _get_settings()
    conn = get_connection(settings.db_path)
    try:
        applied = run_migrations(conn)
        if applied:
            for version in applied:
                typer.echo(f"Applied migration: {version}")
            typer.echo(f"Done. {len(applied)} migration(s) applied.")
        else:
            typer.echo("Database is up to date.")
    finally:
        conn.close()


@app.command()
def import_games() -> None:
    """Import games from the BGG collection."""
    typer.echo("Not implemented yet.")


@app.command()
def import_members(csv_path: str) -> None:
    """Import members from a CSV file."""
    typer.echo("Not implemented yet.")


if __name__ == "__main__":
    app()
