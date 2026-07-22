import type { Context } from "hono";
import type { AppEnv, SessionUser } from "../types";
import { getConfig } from "./env";
import { getSupabaseUser } from "./supabase";

function getBearerToken(c: Context<AppEnv>): string | null {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

function getAdminEmails(c: Context<AppEnv>): string[] {
  return (getConfig(c, "ADMIN_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

// Verifies the Supabase access token against Supabase itself (not a local
// JWT check) so this works regardless of whether the project signs tokens
// with a shared secret or asymmetric keys, and against the ADMIN_EMAILS
// allow-list — Supabase Auth has no roles table, any Google account can sign
// in, so the allow-list is what actually gates admin access.
export async function getAdminUser(c: Context<AppEnv>): Promise<SessionUser | null> {
  const token = getBearerToken(c);
  if (!token) return null;

  const user = await getSupabaseUser(c, token);
  const email = user?.email;
  if (!email) return null;
  if (!getAdminEmails(c).includes(email)) return null;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    email,
    name: (metadata.name as string) ?? (metadata.full_name as string) ?? null,
    picture: (metadata.picture as string) ?? (metadata.avatar_url as string) ?? null,
  };
}
