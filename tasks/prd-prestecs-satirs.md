# PRD: Prestecs Satyrs — Game Lending Manager

## Introduction

Prestecs Satyrs is a web application for the "Refugio del Satyro" RPG association to track board and role-playing game lending. The association owns a collection of games (cataloged in BoardGameGeek) and lends them to its members. The app provides a self-service interface where members can log in, browse the catalog, check out games, and mark returns — giving the group clear visibility into who has what at any time.

## Goals

- Provide a single source of truth for which games are currently lent out and to whom
- Allow any member to self-service borrow and return games without admin intervention
- Maintain a catalog of association-owned games, seeded from a BoardGameGeek (BGG) collection
- Require member authentication so loans are tied to real identities
- Keep the system simple — no due dates, no reservations, no notifications in V1

## User Stories

### US-001: Seed game catalog from BGG
**Description:** As an admin, I want to import the association's game collection from BoardGameGeek so that the catalog is pre-populated without manual data entry.

**Acceptance Criteria:**
- [ ] CLI command fetches the game list from BGG profile `RefugioDelSatiro` via the BGG XML API
- [ ] Each game is stored with: BGG ID, name, thumbnail URL, and year published
- [ ] Duplicate imports update existing entries rather than creating duplicates
- [ ] Import can be re-run to sync new additions
- [ ] Handles BGG API 202 "retry later" responses gracefully
- [ ] Typecheck/lint passes

### US-002: Browse game catalog
**Description:** As a member, I want to browse all available games so that I can find one to borrow.

**Acceptance Criteria:**
- [ ] Game list page shows all games with name, thumbnail, and year
- [ ] Each game shows its current status: "available" or "lent to [member name]"
- [ ] Games can be filtered by availability (all / available / lent out)
- [ ] Games can be searched by name
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Import members from CSV
**Description:** As an admin, I want to import members from a CSV file so that I can onboard them in bulk.

**Acceptance Criteria:**
- [ ] CLI command accepts a CSV file path (the association's `members.csv` format — see below)
- [ ] CSV columns: `Nº Socio`, `Apellidos`, `Nombre`, `Apodo`, `Telefóno`, `Email`, `admin`
- [ ] Display name logic: use `Apodo` (nickname) if present and unique across all members; otherwise use `Nombre Apellidos`
- [ ] All fields are stored: member number, last name, first name, nickname, phone, email, admin flag
- [ ] Members without an email are silently skipped (no warning)
- [ ] Each member is created without a password (password is null)
- [ ] Duplicate emails are upserted: updates fields if email already exists
- [ ] Members are stored sorted by member number (`Nº Socio`)
- [ ] For each new member, command outputs a one-time URL to set their password
- [ ] The one-time URL contains a secure token and expires after 48 hours
- [ ] Admin flag is set to `true` for members with `yes` in the `admin` column
- [ ] Command also supports adding a single member: `--name "Name" --email "email"` (plus optional flags for other fields)
- [ ] Typecheck/lint passes

### US-003b: Set password via one-time URL
**Description:** As a new member, I want to set my password using the link the admin gave me so that I can log in.

**Acceptance Criteria:**
- [ ] One-time URL leads to a "Set your password" page
- [ ] Page validates the token (rejects expired or already-used tokens)
- [ ] Member enters and confirms a password
- [ ] Password is stored hashed; token is invalidated after use
- [ ] After setting password, member is redirected to login
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-004: Member login and logout
**Description:** As a member, I want to log in so that the system knows who I am when I borrow a game.

**Acceptance Criteria:**
- [ ] Login form with email and password
- [ ] On success, session/token is created and member is redirected to the catalog
- [ ] On failure, a clear error message is shown (without revealing whether email exists)
- [ ] Logout button visible when logged in, clears session
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Borrow a game
**Description:** As a logged-in member, I want to borrow an available game so that I can take it home.

**Acceptance Criteria:**
- [ ] "Borrow" button visible on available games only
- [ ] Clicking "Borrow" records the loan: game, member, and borrow date
- [ ] Game status immediately changes to "lent to [my name]"
- [ ] A member can borrow multiple games simultaneously
- [ ] Cannot borrow a game that is already lent out
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Return a game
**Description:** As a member who has borrowed a game, I want to mark it as returned so that others know it's available.

**Acceptance Criteria:**
- [ ] "Return" button visible only on games I currently have borrowed
- [ ] Clicking "Return" marks the loan as completed with a return date
- [ ] Game status changes back to "available"
- [ ] The loan record is preserved in history (not deleted)
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: View my active loans
**Description:** As a member, I want to see which games I currently have so that I know what to return.

**Acceptance Criteria:**
- [ ] "My Loans" page or section showing all games I currently have borrowed
- [ ] Each entry shows game name, thumbnail, and borrow date
- [ ] "Return" button available directly from this view
- [ ] Empty state message when I have no active loans
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: View lending history for a game
**Description:** As a member, I want to see a game's lending history so that I can understand its usage.

**Acceptance Criteria:**
- [ ] Game detail page shows past and current loans
- [ ] Each history entry shows: member name, borrow date, return date (or "currently borrowed")
- [ ] History is ordered most recent first
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: CLI command imports games from BGG profile `RefugioDelSatiro` via the BGG XML API v2
- FR-2: Each game record stores: `bgg_id`, `name`, `thumbnail_url`, `year_published`, `created_at`, `updated_at`
- FR-3: CLI command imports members from a CSV file (association format) or adds a single member via flags
- FR-4: Each member record stores: `member_number`, `first_name`, `last_name`, `nickname` (nullable), `phone` (nullable), `email` (unique), `display_name` (derived: nickname if unique, else "first last"), `password_hash` (nullable), `is_admin` (boolean, default false), `created_at`, `updated_at`
- FR-4b: Members without an email in the CSV are silently skipped
- FR-4c: Default sort order for members is by `member_number`
- FR-5: Authentication uses email + password; password hashed with bcrypt or argon2
- FR-6: New members receive a one-time URL (secure token, 48h expiry) to set their password before first login
- FR-7: A loan record stores: `game_id`, `member_id`, `borrowed_at`, `returned_at` (null while active)
- FR-8: Only one active loan per game at any time (enforced at the database and API level)
- FR-9: Any logged-in member can borrow any available game (self-service)
- FR-10: Only the member who borrowed a game can return it
- FR-11: When a game is lent out, any member can see who has it (by display name)
- FR-12: The catalog page supports text search by game name and filter by availability
- FR-13: All API endpoints that modify data require authentication

## Non-Goals

- No due dates, overdue tracking, or reminders
- No reservation or waitlist system
- No admin approval workflow for loans
- No fine or penalty system
- No email notifications
- No role-based permissions beyond "logged in" vs "admin" in V1 (admin flag stored but admin-only UI features deferred to future versions)
- No game ratings or reviews
- No mobile-specific app (responsive web only)

## Design Considerations

- Simple, clean interface — prioritize clarity over visual polish
- Game cards with thumbnails pulled from BGG
- Clear visual distinction between available and lent-out games
- Responsive layout that works on phones (members may check at game nights)

## Technical Considerations

- **Backend:** Python with Clean Architecture (domain/data/API layers)
- **Database:** SQLite — single file, no server, sufficient for association-scale usage
- **Frontend:** React + TypeScript + Vite
- **BGG integration:** BGG XML API v2 (`https://boardgamegeek.com/xmlapi2/collection?username=RefugioDelSatiro`) — note: this API can return 202 "please wait" responses that require retry logic
- **Member import:** CSV file matching the association's format (`Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin`). Future versions may add Google Sheets integration (see `tasks/future-ideas.md`).
- **Display name derivation:** Use the `Apodo` (nickname) if present and unique across all members; otherwise fall back to `Nombre Apellidos`.
- **Authentication:** Password hashing with bcrypt or argon2. New members set their password via a one-time tokenized URL (48h expiry).
- **Game thumbnails:** Stored as URLs pointing to BGG CDN, not downloaded locally

## Success Metrics

- Any member can borrow a game in under 3 clicks from the catalog
- The catalog accurately reflects which games are available at any moment
- Full BGG collection imported successfully on first run

## Resolved Questions

- **BGG profile:** `RefugioDelSatiro` (https://boardgamegeek.com/profile/RefugioDelSatiro)
- **BGG import:** CLI command (admin only)
- **Loan visibility:** Members can see who has a game (by display name)
- **Member list page:** Out of scope for V1
- **Member source:** CSV file (association format with all fields), imported via CLI command
- **Display name:** Nickname (Apodo) if present and unique, otherwise "Nombre Apellidos"
- **Admin flag:** Stored per member, imported from CSV `admin` column
- **Members without email:** Silently skipped during import
- **First login flow:** One-time tokenized URL (48h expiry) generated by CLI, shared by admin

## Open Questions

None — all questions resolved.
