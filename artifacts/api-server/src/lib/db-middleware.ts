import { createDb } from "@workspace/db";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

// Node runs as one long-lived process, so the pool is created once and
// reused for every request.
let nodeDb: ReturnType<typeof createDb> | undefined;

export const dbMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const hyperdrive = c.env?.HYPERDRIVE;

  if (hyperdrive) {
    // Cloudflare Workers isolates are short-lived and Hyperdrive already
    // pools connections on Cloudflare's side, so a fresh pool per request
    // (closed at the end of the request) is the recommended pattern.
    const { pool, db } = createDb(hyperdrive.connectionString);
    c.set("db", db);
    try {
      await next();
    } finally {
      c.executionCtx.waitUntil(pool.end());
    }
    return;
  }

  if (!nodeDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    nodeDb = createDb(connectionString);
  }
  c.set("db", nodeDb.db);
  await next();
};
