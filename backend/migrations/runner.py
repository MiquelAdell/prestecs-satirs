from __future__ import annotations

import sqlite3
from pathlib import Path


MIGRATIONS_DIR = Path(__file__).parent


def _ensure_schema_table(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )
        """
    )


def _get_applied_versions(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT version FROM schema_migrations").fetchall()
    return {row[0] for row in rows}


def _get_pending_migrations(
    applied: set[str],
) -> list[tuple[str, str]]:
    """Return (version, sql) pairs for unapplied migrations, sorted by version."""
    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    pending = []
    for path in sql_files:
        version = path.stem
        if version not in applied:
            pending.append((version, path.read_text(encoding="utf-8")))
    return pending


def run_migrations(conn: sqlite3.Connection) -> list[str]:
    """Run all pending migrations. Returns list of applied version names."""
    _ensure_schema_table(conn)
    applied = _get_applied_versions(conn)
    pending = _get_pending_migrations(applied)

    applied_now: list[str] = []
    for version, sql in pending:
        conn.executescript(sql)
        conn.execute(
            "INSERT INTO schema_migrations (version) VALUES (?)", (version,)
        )
        conn.commit()
        applied_now.append(version)

    return applied_now
