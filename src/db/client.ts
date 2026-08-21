import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

declare global {
  // eslint-disable-next-line no-var
  var __limsSqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __limsDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getRawDb(): Database.Database {
  if (global.__limsSqlite) return global.__limsSqlite;
  const url = process.env.DATABASE_URL || "file:./lims.db";
  const path = url.startsWith("file:") ? url.slice(5) : url;
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {}
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  global.__limsSqlite = sqlite;
  return sqlite;
}

function getDb() {
  if (!global.__limsDb) {
    global.__limsDb = drizzle(getRawDb(), { schema });
  }
  return global.__limsDb;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema, getDb };
