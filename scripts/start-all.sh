#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d node_modules ]; then
  echo "node_modules not found, installing dependencies..."
  npm install
fi

RESUME_ENGINE_PORT="${RESUME_ENGINE_PORT:-3000}"
NOTIFICATION_SERVICE_PORT="${NOTIFICATION_SERVICE_PORT:-3001}"

cleanup() {
  trap - EXIT INT TERM
  echo ""
  echo "Stopping services..."
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo ""
echo "Starting resume-engine      -> http://localhost:${RESUME_ENGINE_PORT}/api/v1"
echo "Starting notification-svc   -> http://localhost:${NOTIFICATION_SERVICE_PORT}"
echo "Press Ctrl+C to stop both services."
echo ""

npx nest start resume-engine --watch &
npx nest start notification-service --watch &

wait