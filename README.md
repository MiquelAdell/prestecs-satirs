# Prestecs Satirs

A web application to manage board game lending for the **Refugio del Satyro** RPG association.

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

## License

GPL-3.0
