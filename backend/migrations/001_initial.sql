-- Initial schema for Prestecs Satyrs

CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bgg_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    year_published INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_number INTEGER UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    borrowed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    returned_at TEXT
);

CREATE TABLE password_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    expires_at TEXT NOT NULL,
    used_at TEXT
);

-- Only one active loan per game at a time
CREATE UNIQUE INDEX idx_loans_active_game ON loans (game_id) WHERE returned_at IS NULL;

-- Efficient queries for game history and member loans
CREATE INDEX idx_loans_game_returned ON loans (game_id, returned_at);
CREATE INDEX idx_loans_member_returned ON loans (member_id, returned_at);

-- Fast token lookups
CREATE INDEX idx_password_tokens_token ON password_tokens (token);
