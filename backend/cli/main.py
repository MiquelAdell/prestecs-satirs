import typer

app = typer.Typer(name="game-lending", help="Prestecs Satyrs — game lending CLI")


@app.command()
def import_games() -> None:
    """Import games from the BGG collection."""
    typer.echo("Not implemented yet.")


@app.command()
def import_members(csv_path: str) -> None:
    """Import members from a CSV file."""
    typer.echo("Not implemented yet.")


@app.command()
def migrate() -> None:
    """Run database migrations."""
    typer.echo("Not implemented yet.")


if __name__ == "__main__":
    app()
