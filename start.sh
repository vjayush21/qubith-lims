#!/bin/sh
set -e
echo "[start.sh] Initializing database schema..."

# Apply Drizzle migration SQL files in order
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const url = process.env.DATABASE_URL || 'file:/app/data/lims.db';
const dbPath = url.startsWith('file:') ? url.slice(5) : url;
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
const drizzleDir = './drizzle';
if (fs.existsSync(drizzleDir)) {
  const files = fs.readdirSync(drizzleDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(drizzleDir, f), 'utf-8');
    // Skip Postgres-specific migrations
    if (sql.includes('CREATE POLICY') || sql.includes('current_tenant_id()') || sql.includes('ALTER TABLE') && sql.includes('ENABLE ROW LEVEL SECURITY')) {
      console.log('[start.sh] Skipping Postgres-specific migration: ' + f);
      continue;
    }
    if (sql.includes('--> statement-breakpoint')) {
      const stmts = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
      for (const stmt of stmts) db.exec(stmt);
    } else {
      db.exec(sql);
    }
    console.log('[start.sh] Applied: ' + f);
  }
}
console.log('[start.sh] Schema initialized');
db.close();
"

echo "[start.sh] Starting Next.js..."
exec node server.js
