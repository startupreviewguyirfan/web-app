import type { Context } from "hono";
import type { AppEnv } from "../types";

/**
 * Reads a config value that comes from Cloudflare Worker bindings/vars when
 * deployed there, falling back to process.env under Node (local dev, or a
 * plain Node deployment).
 */
export function getConfig<K extends keyof AppEnv["Bindings"]>(
  c: Context<AppEnv>,
  key: K,
): AppEnv["Bindings"][K] | undefined {
  return c.env?.[key] ?? (process.env[key] as AppEnv["Bindings"][K] | undefined);
}

export function isProd(c: Context<AppEnv>): boolean {
  return getConfig(c, "NODE_ENV") === "production";
}
