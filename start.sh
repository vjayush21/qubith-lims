#!/bin/sh
set -e
echo "[start.sh] Running database migrations..."
node -e "
const Database = require('better-sqlite3');
const path = require('path');
const url = process.env.DATABASE_URL || 'file:/app/data/lims.db';
const dbPath = url.startsWith('file:') ? url.slice(5) : url;
const db = new Database(dbPath);
const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const sql = fs.readFileSync('./drizzle/0000_*.sql', 'utf-8');
db.exec(sql);
console.log('[start.sh] Migrations applied');
db.close();
" || echo "[start.sh] No migration file found, relying on app initialization"
echo "[start.sh] Starting Next.js..."
exec node server.js
