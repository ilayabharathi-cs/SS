#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "          SMARTSHIELD IoT — ALL-IN-ONE RUNNER               "
echo "============================================================"

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "[*] Shutting down background services..."
    if [ -n "$BACKEND_PID" ]; then
        kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "[*] Services stopped cleanly."
}
trap cleanup EXIT INT TERM

# Ensure ports 8000 and 5173 are freed if previously occupied
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true

# 1. Start Local PostgreSQL Database
echo "[1/4] Checking & Starting PostgreSQL Database..."
if ! pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    /usr/lib/postgresql/18/bin/pg_ctl -D "$PROJECT_ROOT/backend/.postgres" -o "-k $PROJECT_ROOT/backend/.postgres" start
else
    echo "  -> PostgreSQL is already running."
fi

# 2. Start FastAPI Backend Server
echo "[2/4] Starting FastAPI Backend Server on http://localhost:8000..."
cd "$PROJECT_ROOT/backend"
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd "$PROJECT_ROOT"

# Wait for Backend health check
echo "  -> Waiting for Backend to become ready..."
until curl -s http://localhost:8000/api/health >/dev/null 2>&1; do
    sleep 0.5
done
echo "  -> Backend is live! (http://localhost:8000)"

# 3. Start Frontend Dev Server
echo "[3/4] Starting Frontend Dev Server on http://localhost:5173..."
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
cd "$PROJECT_ROOT"

# Wait for Frontend
echo "  -> Waiting for Frontend to become ready..."
until curl -s http://localhost:5173 >/dev/null 2>&1; do
    sleep 0.5
done
echo "  -> Frontend is live! (http://localhost:5173)"

# 4. Trigger System Load & Performance Test (Optional)
if [ "$1" == "--test" ] || [ "$LOAD_TEST" == "1" ]; then
    echo "[4/4] Triggering Load Test against Backend..."
    backend/.venv/bin/python3 backend/tests/load_test.py
else
    echo "[4/4] Skipping Load Test (Pass --test to run load test)."
fi

echo ""
echo "============================================================"
echo "  ALL SERVICES OPERATIONAL!                                 "
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend UI:  http://localhost:5173"
echo "  (Press Ctrl+C to stop background services)"
echo "============================================================"

# Keep script active to maintain background processes
wait $BACKEND_PID $FRONTEND_PID

