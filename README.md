# Prestecs Satyrs

Aplicació web per gestionar el préstec de jocs de taula de l'associació **Refugio del Satyro**.

Els socis poden navegar pel catàleg, agafar jocs en préstec i retornar-los. El catàleg s'importa des de [BoardGameGeek](https://boardgamegeek.com/collection/user/RefugioDelSatiro?subtype=boardgame&own=1&ff=1).

## Stack tecnològic

- **Backend:** Python 3.12+ / FastAPI / SQLite
- **Frontend:** React / TypeScript / Vite
- **CLI:** Typer (`game-lending`)
- **Tests:** pytest (backend), Vitest (frontend), Playwright (e2e)

## Requisits

- Python 3.12+
- Node.js 18+
- pip

## Instal·lació

```bash
# Backend
pip install -e ".[dev]"

# Frontend
cd frontend && npm install && cd ..
```

## Desenvolupament

```bash
# Migrar la base de dades
game-lending migrate

# Importar jocs (des de fitxer JSON)
game-lending import-games data/bgg_collection.json

# Importar socis
game-lending import-members members.csv --base-url http://localhost:5173

# Arrencar el backend (port 8000)
uvicorn backend.api.app:create_app --factory --reload --port 8000

# Arrencar el frontend (port 5173, amb proxy a /api)
cd frontend && npm run dev
```

Obre http://localhost:5173 per veure l'aplicació.

## CLI

```bash
game-lending migrate                          # Executar migracions
game-lending import-games data/bgg_collection.json  # Importar jocs des de JSON
game-lending import-games                     # Importar jocs des de l'API de BGG (requereix BGG_BEARER_TOKEN)
game-lending import-members members.csv       # Importar socis des de CSV
game-lending import-members --email x@y.com --name "Nom Cognom"  # Afegir un soci manualment
```

## Tests

```bash
# Backend
pytest
pytest --cov=backend --cov-report=term-missing

# Frontend
cd frontend && npm test

# Lint i format
ruff check backend/ tests/
black backend/ tests/
cd frontend && npm run lint
```

## Arquitectura

Clean Architecture amb capes estrictes:

```
backend/
├── domain/          # Entitats, Protocols, Casos d'ús (sense dependències d'infraestructura)
├── data/            # Repositoris SQLite, client BGG
├── api/             # FastAPI (rutes, auth, dependències)
├── cli/             # Comandes Typer
├── config.py        # Configuració (variables d'entorn)
└── migrations/      # Fitxers SQL versionats

frontend/
├── src/
│   ├── api/         # Client HTTP tipat
│   ├── components/  # Components React reutilitzables
│   ├── context/     # AuthContext
│   ├── hooks/       # Hooks de dades
│   ├── pages/       # Pàgines (Catàleg, Detall, Préstecs, Login)
│   └── types/       # Tipus TypeScript
```

## Variables d'entorn

| Variable | Descripció | Per defecte |
|----------|-----------|-------------|
| `PRESTECS_DB_PATH` | Ruta del fitxer SQLite | `prestecs.db` |
| `PRESTECS_JWT_SECRET` | Secret per signar JWT | (dev secret) |
| `PRESTECS_BASE_URL` | URL pública de l'app | `http://localhost:8000` |
| `BGG_BEARER_TOKEN` | Token de l'API de BGG (opcional) | — |
| `VITE_API_URL` | URL base de l'API al frontend | `/api` |

## Llicència

GPL-3.0
