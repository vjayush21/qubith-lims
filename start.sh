#!/bin/sh
set -e
echo "[start.sh] Running database migrations..."
node ./node_modules/drizzle-kit/bin.cjs push:sqlite --config=drizzle.config.ts --force 2>&1 || echo "[start.sh] drizzle-kit push failed, trying inline schema bootstrap..."

echo "[start.sh] Starting Next.js..."
cd /app
exec node server.js
