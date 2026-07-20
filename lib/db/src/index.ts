import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * Creates a fresh pool + drizzle client for a given connection string.
 *
 * Callers own the returned pool's lifecycle. Node processes (local dev, the
 * long-lived API server) should create one and reuse it for the life of the
 * process. Cloudflare Workers (via Hyperdrive) should create one per request
 * and close it afterwards, since Hyperdrive does the real connection pooling
 * on Cloudflare's side and Workers isolates are short-lived.
 */
export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return { pool, db: drizzle(pool, { schema }) };
}

export * from "./schema";
