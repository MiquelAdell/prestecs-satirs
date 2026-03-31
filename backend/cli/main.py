from __future__ import annotations

import csv
from pathlib import Path
from typing import Annotated, Optional

import typer

from backend.config import Settings
from backend.data.database import get_connection
from backend.data.repositories.sqlite_member_repository import SqliteMemberRepository
from backend.data.repositories.sqlite_password_token_repository import (
    SqlitePasswordTokenRepository,
)
from backend.domain.use_cases.import_members import ImportMembersUseCase
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
    """Import owned games from the BGG collection (RefugioDelSatiro)."""
    settings = _get_settings()
    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        from backend.data.bgg_client import BggClient
        from backend.data.repositories.sqlite_game_repository import SqliteGameRepository
        from backend.domain.use_cases.import_games import ImportGamesUseCase

        game_repo = SqliteGameRepository(conn)
        bgg_client = BggClient(username="RefugioDelSatiro")
        use_case = ImportGamesUseCase(game_repo, bgg_client)

        typer.echo("Fetching games from BGG (this may take a moment)...")
        result = use_case.execute()
        typer.echo(f"Done. {result.created} new, {result.updated} updated, {result.total} total.")
    finally:
        conn.close()


@app.command()
def import_members(
    csv_path: Annotated[
        Optional[str],
        typer.Argument(help="Path to CSV file to import"),
    ] = None,
    base_url: Annotated[
        str,
        typer.Option(
            "--base-url",
            help="Base URL for one-time password links",
        ),
    ] = "",
    name: Annotated[
        Optional[str],
        typer.Option("--name", help="Full name for single member add (Nombre Apellidos)"),
    ] = None,
    email: Annotated[
        Optional[str],
        typer.Option("--email", help="Email for single member add"),
    ] = None,
    nickname: Annotated[
        Optional[str],
        typer.Option("--nickname", help="Nickname for single member add"),
    ] = None,
    phone: Annotated[
        Optional[str],
        typer.Option("--phone", help="Phone for single member add"),
    ] = None,
    member_number: Annotated[
        Optional[int],
        typer.Option("--member-number", help="Member number for single member add"),
    ] = None,
    admin: Annotated[
        bool,
        typer.Option("--admin", help="Set admin flag for single member"),
    ] = False,
) -> None:
    """Import members from a CSV file or add a single member."""
    settings = _get_settings()
    resolved_base_url = base_url or settings.base_url

    conn = get_connection(settings.db_path)
    try:
        run_migrations(conn)
        member_repo = SqliteMemberRepository(conn)
        token_repo = SqlitePasswordTokenRepository(conn)
        use_case = ImportMembersUseCase(member_repo, token_repo, resolved_base_url)

        if email:
            # Single member add mode
            parts = (name or "").split(" ", 1)
            first_name = parts[0] if parts else ""
            last_name = parts[1] if len(parts) > 1 else ""

            raw_members = [
                {
                    "Nº Socio": str(member_number) if member_number is not None else "",
                    "Apellidos": last_name,
                    "Nombre": first_name,
                    "Apodo": nickname or "",
                    "Telefóno": phone or "",
                    "Email": email,
                    "admin": "yes" if admin else "",
                }
            ]
        elif csv_path:
            # CSV import mode
            path = Path(csv_path)
            if not path.exists():
                typer.echo(f"Error: file not found: {csv_path}", err=True)
                raise typer.Exit(code=1)

            with path.open(encoding="utf-8") as f:
                reader = csv.DictReader(f)
                raw_members = list(reader)
        else:
            typer.echo(
                "Error: provide a CSV path or --email for single member add.",
                err=True,
            )
            raise typer.Exit(code=1)

        results = use_case.execute(raw_members)

        for result in results:
            typer.echo(
                f"{result.member.display_name} ({result.member.email}): "
                f"{result.token_url}"
            )

        if not results:
            typer.echo("No new members added.")
        else:
            typer.echo(f"\n{len(results)} new member(s) imported.")
    finally:
        conn.close()


if __name__ == "__main__":
    app()
