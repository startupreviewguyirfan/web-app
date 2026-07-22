import type { Context } from "hono";
import type { AppEnv } from "../types";
import { getConfig } from "./env";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

// Verifies a Supabase access token via the Auth REST API directly (GET
// /auth/v1/user) rather than the full @supabase/supabase-js client — that
// client eagerly constructs a Realtime client on instantiation, which
// requires a global WebSocket and throws on Node < 22, even though we never
// use realtime, Postgrest, or Storage here, only token verification. Plain
// fetch works identically on Node and Workers.
export async function getSupabaseUser(
  c: Context<AppEnv>,
  token: string,
): Promise<SupabaseUser | null> {
  const url = getConfig(c, "SUPABASE_URL");
  const publishableKey = getConfig(c, "SUPABASE_PUBLISHABLE_KEY");
  if (!url || !publishableKey) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY env vars are required");
  }

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: publishableKey,
    },
  });

  if (!res.ok) return null;
  return (await res.json()) as SupabaseUser;
}
