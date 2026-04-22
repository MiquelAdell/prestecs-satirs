# Refugio del Sátiro

Website for the **Refugio del Sátiro** RPG association.

Current scope: the game-lending feature (mounted at `/prestecs`). Members can
browse the catalog, borrow games, and return them. The catalog is imported
from [BoardGameGeek](https://boardgamegeek.com/collection/user/RefugioDelSatiro?subtype=boardgame&own=1&ff=1).

Everything else under `/` is mirrored from the club's Google Sites site by a
small scraper (see `scraper/`) and served as static files by Caddy.

## Tech Stack

- **Backend:** Python 3.12+ / FastAPI / SQLite
- **Frontend:** React / TypeScript / Vite
- **CLI:** Typer (`refugio`)
- **Tests:** pytest (backend), Vitest (frontend), Playwright (e2e)

## Requirements

- Python 3.12+
- Node.js 18+
- pip

## Installation

```bash
# Backend
pip install -e ".[dev]"

# Frontend
cd frontend && npm install && cd ..
```

## Development

```bash
# Run database migrations
refugio migrate

# Import games (from JSON seed file)
refugio import-games data/bgg_collection.json

# Import members
refugio import-members members.csv --base-url http://localhost:5173/prestecs

# Start the backend (port 8000)
uvicorn backend.api.app:create_app --factory --reload --port 8000

# Start the frontend (port 5173, proxies /prestecs/api to backend)
cd frontend && npm run dev
```

Open http://localhost:5173/prestecs to view the lending app.

## CLI

```bash
refugio migrate                          # Run migrations
refugio import-games data/bgg_collection.json  # Import games from JSON
refugio import-games                     # Import games from BGG API (requires BGG_BEARER_TOKEN)
refugio import-members members.csv       # Import members from CSV
refugio import-members --email x@y.com --name "First Last"  # Add a single member

refugio content run                      # Scrape Google Sites → frontend/public/content-mirror/
refugio content run --dry-run            # Preview, don't write anything
refugio content list-urls                # Enumerate pages without scraping
python -m scraper                        # Equivalent to `refugio content run`
```

See [`scraper/README.md`](scraper/README.md) for the content-mirror
architecture, extension points, and gotchas.

## Tests

```bash
# Backend
pytest
pytest --cov=backend --cov-report=term-missing

# Frontend
cd frontend && npm test

# Lint and format
ruff check backend/ tests/
black backend/ tests/
cd frontend && npm run lint
```

## Architecture

Clean Architecture with strict layered dependencies:

```
backend/
├── domain/          # Entities, Protocols, Use cases (zero infrastructure deps)
├── data/            # SQLite repositories, BGG client
├── api/             # FastAPI (routes, auth, dependencies)
├── cli/             # Typer commands
├── config.py        # Settings (env vars)
└── migrations/      # Versioned SQL files

frontend/
├── src/
│   ├── api/         # Typed HTTP client
│   ├── components/  # Reusable React components
│   ├── context/     # AuthContext
│   ├── hooks/       # Data fetching hooks
│   ├── pages/       # Pages (Catalog, Detail, My Loans, Login)
│   └── types/       # TypeScript interfaces
```

## Environment Variables

| Variable | Description | Default |
|----------|------------|---------|
| `REFUGIO_DB_PATH` | SQLite database file path | `refugio.db` |
| `REFUGIO_JWT_SECRET` | JWT signing secret | (dev secret) |
| `REFUGIO_BASE_URL` | Lending app public URL (used in reset-password emails) | `http://localhost:5173/prestecs` |
| `REFUGIO_CONTENT_MIRROR_DIR` | Where the admin "Resync content" button writes scraped pages | `frontend/public/content-mirror` (dev) / `/srv/content` (prod) |
| `BGG_BEARER_TOKEN` | BGG API bearer token (optional) | — |
| `VITE_API_URL` | Frontend API base URL | `/prestecs/api` |

## Deployment (VPS with Docker)

The project includes Docker and Docker Compose configuration for deployment on any VPS (tested on RackNerd, Hetzner).

### First-time server setup

```bash
# SSH into your VPS as root and run the setup script:
bash <(curl -sSL https://raw.githubusercontent.com/<user>/refugio-del-satiro/development/deploy/setup-server.sh)
```

This installs Docker, creates a `deploy` user, and configures the firewall.

### Deploy the app

```bash
# SSH as deploy user
ssh deploy@<server-ip>

# Clone and configure
git clone <repo-url> ~/refugio-del-satiro
cd ~/refugio-del-satiro
cp .env.production .env
# Edit .env — set REFUGIO_JWT_SECRET and DOMAIN
nano .env

# Start everything
docker compose up -d

# Import data
docker compose exec app refugio migrate
docker compose exec app refugio import-games data/bgg_collection.json
```

### Update after changes

```bash
cd ~/refugio-del-satiro
./deploy/deploy.sh
```

### Automatic deployment

Pushes to `development` trigger [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which SSHes into the server and runs `deploy/deploy.sh`. Requires these GitHub
Actions secrets on the repository:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | Server hostname or IP (e.g. `45.95.175.19`) |
| `DEPLOY_USER` | SSH user (e.g. `root`) |
| `DEPLOY_SSH_KEY` | Private SSH key authorised on the server |
| `DEPLOY_PORT` | SSH port, optional (defaults to `22`) |
| `CONTENT_SYNC_PAT` | Fine-grained PAT (`contents: write`) used by the nightly content-sync workflow to commit back to `development`. The default `GITHUB_TOKEN` can't trigger downstream workflows on its own pushes. |

### Content sync (nightly)

[`.github/workflows/content-sync.yml`](.github/workflows/content-sync.yml) runs
the scraper at 03:17 UTC every day, commits any diff under
`frontend/public/content-mirror/` to `development`, and relies on
`deploy.yml` to pick the new commit up. Can be triggered manually via
`workflow_dispatch` in the GitHub Actions tab.

### What the stack runs

- **App container**: Python 3.12 + FastAPI serving API and built React frontend
- **Caddy container**: Reverse proxy with automatic HTTPS via Let's Encrypt
- **Persistent volume**: SQLite database survives container restarts

### Alternative: Render

A [`render.yaml`](render.yaml) blueprint is also included for deployment to [Render](https://render.com) (free tier with limitations).

## License

GPL-3.0
