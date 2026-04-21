# Préstecs Sàtirs

A web application to manage board game lending for the **Refugio del Sátiro** RPG association.

Members can browse the catalog, borrow games, and return them. The catalog is imported from [BoardGameGeek](https://boardgamegeek.com/collection/user/RefugioDelSatiro?subtype=boardgame&own=1&ff=1).

## Tech Stack

- **Backend:** Python 3.12+ / FastAPI / SQLite
- **Frontend:** React / TypeScript / Vite
- **CLI:** Typer (`game-lending`)
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
game-lending migrate

# Import games (from JSON seed file)
game-lending import-games data/bgg_collection.json

# Import members
game-lending import-members members.csv --base-url http://localhost:5173

# Start the backend (port 8000)
uvicorn backend.api.app:create_app --factory --reload --port 8000

# Start the frontend (port 5173, proxies /api to backend)
cd frontend && npm run dev
```

Open http://localhost:5173 to view the application.

## CLI

```bash
game-lending migrate                          # Run migrations
game-lending import-games data/bgg_collection.json  # Import games from JSON
game-lending import-games                     # Import games from BGG API (requires BGG_BEARER_TOKEN)
game-lending import-members members.csv       # Import members from CSV
game-lending import-members --email x@y.com --name "First Last"  # Add a single member
```

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
| `PRESTECS_DB_PATH` | SQLite database file path | `prestecs.db` |
| `PRESTECS_JWT_SECRET` | JWT signing secret | (dev secret) |
| `PRESTECS_BASE_URL` | App public URL | `http://localhost:8000` |
| `BGG_BEARER_TOKEN` | BGG API bearer token (optional) | — |
| `VITE_API_URL` | Frontend API base URL | `/api` |

## Deployment (VPS with Docker)

The project includes Docker and Docker Compose configuration for deployment on any VPS (tested on RackNerd, Hetzner).

### First-time server setup

```bash
# SSH into your VPS as root and run the setup script:
bash <(curl -sSL https://raw.githubusercontent.com/<user>/prestecs-satirs/development/deploy/setup-server.sh)
```

This installs Docker, creates a `deploy` user, and configures the firewall.

### Deploy the app

```bash
# SSH as deploy user
ssh deploy@<server-ip>

# Clone and configure
git clone <repo-url> ~/prestecs-satirs
cd ~/prestecs-satirs
cp .env.production .env
# Edit .env — set PRESTECS_JWT_SECRET and DOMAIN
nano .env

# Start everything
docker compose up -d

# Import data
docker compose exec app game-lending migrate
docker compose exec app game-lending import-games data/bgg_collection.json
```

### Update after changes

```bash
cd ~/prestecs-satirs
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

### What the stack runs

- **App container**: Python 3.12 + FastAPI serving API and built React frontend
- **Caddy container**: Reverse proxy with automatic HTTPS via Let's Encrypt
- **Persistent volume**: SQLite database survives container restarts

### Alternative: Render

A [`render.yaml`](render.yaml) blueprint is also included for deployment to [Render](https://render.com) (free tier with limitations).

## License

GPL-3.0
