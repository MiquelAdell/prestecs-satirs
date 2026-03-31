from __future__ import annotations

import secrets
import sqlite3
from datetime import UTC, datetime, timedelta

from backend.domain.entities.password_token import PasswordToken


def _row_to_token(row: sqlite3.Row) -> PasswordToken:
    return PasswordToken(
        id=row["id"],
        token=row["token"],
        member_id=row["member_id"],
        created_at=datetime.fromisoformat(row["created_at"]),
        expires_at=datetime.fromisoformat(row["expires_at"]),
        used_at=datetime.fromisoformat(row["used_at"]) if row["used_at"] else None,
    )


class SqlitePasswordTokenRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def create(self, member_id: int) -> PasswordToken:
        token = secrets.token_hex(32)
        now = datetime.now(UTC)
        expires = now + timedelta(hours=48)
        now_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        expires_str = expires.strftime("%Y-%m-%dT%H:%M:%SZ")

        cursor = self._conn.execute(
            "INSERT INTO password_tokens (token, member_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, member_id, now_str, expires_str),
        )
        self._conn.commit()

        row = self._conn.execute(
            "SELECT * FROM password_tokens WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        assert row is not None
        return _row_to_token(row)

    def get_by_token(self, token: str) -> PasswordToken | None:
        row = self._conn.execute(
            "SELECT * FROM password_tokens WHERE token = ?", (token,)
        ).fetchone()
        return _row_to_token(row) if row else None

    def mark_used(self, token_id: int) -> None:
        now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
        self._conn.execute(
            "UPDATE password_tokens SET used_at = ? WHERE id = ?",
            (now, token_id),
        )
        self._conn.commit()
