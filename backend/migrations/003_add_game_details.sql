-- Add game details: player count, play time, BGG rating, storage location
ALTER TABLE games ADD COLUMN min_players INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN max_players INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN playing_time INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN bgg_rating REAL NOT NULL DEFAULT 0.0;
ALTER TABLE games ADD COLUMN location TEXT NOT NULL DEFAULT 'armari';
