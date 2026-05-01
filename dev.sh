#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

eval "$(pyenv init -)"

pip install -e . --quiet

python -m uvicorn backend.api.app:create_app --factory --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo ""

wait
