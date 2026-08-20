#!/usr/bin/env bash
# dev.sh — kill and restart the FetchMart dev stack.
# Each service opens in its own Terminal window.
# Usage:  ./dev.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/market-backend"
ADMIN="$ROOT/admin"
APP="$ROOT/FetchMart"

# ── Ports / patterns to kill ─────────────────────────────────────────────────
PORTS=(3000 3001 8081)
PATTERNS=("nest start" "next dev" "expo start")

echo ""
echo "═══════════════════════════════════════════════"
echo "  FetchMart dev stack  —  starting up"
echo "═══════════════════════════════════════════════"

# ── 1. Kill existing processes ───────────────────────────────────────────────
echo ""
echo "▶ Stopping existing processes..."

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "  Killing PIDs on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

for pattern in "${PATTERNS[@]}"; do
  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "  Killing '$pattern' PIDs: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

sleep 1
echo "  Done."

# ── 2. Helper: write a .command file and open it in a new Terminal window ─────
# Uses $$ (script PID) + a counter for unique, predictable file names —
# avoids the macOS mktemp suffix limitation entirely.
_counter=0
open_window() {
  local title="$1"
  local dir="$2"
  local cmd="$3"
  _counter=$(( _counter + 1 ))

  local tmp="/tmp/fm_dev_$$_${_counter}.command"

  cat > "$tmp" << SCRIPT
#!/bin/bash
printf '\033]0;${title}\007'
cd '${dir}'
${cmd}
echo ""
echo "[process ended — close this window when done]"
SCRIPT

  chmod +x "$tmp"
  open "$tmp"
  sleep 0.5   # let Terminal open before launching the next one
}

# ── 3. Launch each service ───────────────────────────────────────────────────
echo ""
echo "▶ Opening Terminal windows..."

open_window "Backend  :3000" "$BACKEND" "npm run start:dev"
open_window "Admin    :3001" "$ADMIN"   "npm run dev -- --port 3001"
open_window "FetchMart iOS"  "$APP"     "npx expo run:ios"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Backend  →  http://localhost:3000"
echo "  Admin    →  http://localhost:3001"
echo "  iOS sim  →  auto-launches via Xcode build (FetchMart iOS window)"
echo "═══════════════════════════════════════════════"
echo ""
