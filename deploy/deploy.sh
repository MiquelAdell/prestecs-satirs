#!/usr/bin/env bash
# Run from the project root on the server to deploy or update.
# Usage: ./deploy/deploy.sh
set -euo pipefail

echo "==> Pulling latest code"
git pull

echo "==> Building and starting containers"
docker compose up -d --build

echo "==> Running migrations"
docker compose exec app refugio migrate

echo "==> Importing and enriching games from BGG"
docker compose exec app refugio import-games
docker compose exec app refugio enrich-games

echo "==> Deploy complete!"
echo "    App is running at $(grep REFUGIO_BASE_URL .env | cut -d= -f2)"
