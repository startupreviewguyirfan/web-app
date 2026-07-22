import { Hono } from "hono";
import type { AppEnv } from "../types";
import { getAdminUser } from "../lib/auth-user";

const auth = new Hono<AppEnv>();

// Google sign-in itself happens entirely client-side via supabase-js
// (supabase.auth.signInWithOAuth); this just tells the frontend whether the
// bearer token it's holding belongs to an allow-listed admin.
auth.get("/auth/session", async (c) => {
  const user = await getAdminUser(c);
  if (!user) return c.json({ authenticated: false });
  return c.json({ authenticated: true, user });
});

export default auth;
