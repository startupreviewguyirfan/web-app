import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import { getConfig, isProd } from "../lib/env";
import { createSession, getSessionUser, clearSession } from "../lib/session";

const STATE_COOKIE = "oauth_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const auth = new Hono<AppEnv>();

function getRedirectUri(c: Context<AppEnv>): string {
  return `${new URL(c.req.url).origin}/api/auth/google/callback`;
}

function getAdminEmails(c: Context<AppEnv>): string[] {
  return (getConfig(c, "ADMIN_EMAILS") ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

// Get current session info
auth.get("/auth/session", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ authenticated: false });
  return c.json({ authenticated: true, user });
});

// Start Google OAuth flow
auth.get("/auth/google", (c) => {
  const clientId = getConfig(c, "GOOGLE_CLIENT_ID");
  if (!clientId) {
    return c.text("Google OAuth is not configured", 503);
  }

  const state = crypto.randomUUID();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProd(c),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(c),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

// Google OAuth callback
auth.get("/auth/google/callback", async (c) => {
  const clientId = getConfig(c, "GOOGLE_CLIENT_ID");
  const clientSecret = getConfig(c, "GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return c.redirect("/?auth=failed");
  }

  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: "/" });

  if (!code || !state || state !== expectedState) {
    return c.redirect("/?auth=failed");
  }

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(c),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return c.redirect("/?auth=failed");
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return c.redirect("/?auth=failed");
  }

  const profile = (await userRes.json()) as {
    email?: string;
    name?: string;
    picture?: string;
  };
  const email = profile.email ?? "";
  const isAdmin = email !== "" && getAdminEmails(c).includes(email);

  if (!isAdmin) {
    return c.redirect("/?auth=failed");
  }

  await createSession(c, {
    email,
    name: profile.name ?? null,
    picture: profile.picture ?? null,
  });

  return c.redirect("/admin-access");
});

// Logout
auth.post("/auth/logout", (c) => {
  clearSession(c);
  return c.json({ success: true });
});

export default auth;
