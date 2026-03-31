-- Add is_active column to members table
ALTER TABLE members ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
