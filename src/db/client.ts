import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __limsPg: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __limsDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!global.__limsPg) {
    global.__limsPg = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return global.__limsPg;
}

function getDb() {
  if (!global.__limsDb) {
    global.__limsDb = drizzle(getConnection(), { schema });
  }
  return global.__limsDb;
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema, getDb };
