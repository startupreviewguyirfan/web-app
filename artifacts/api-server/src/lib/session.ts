import { sign, verify } from "hono/jwt";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppEnv, SessionUser } from "../types";
import { getConfig, isProd } from "./env";

const COOKIE_NAME = "session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSessionSecret(c: Context<AppEnv>): string {
  const secret = getConfig(c, "SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  return secret;
}

export async function createSession(
  c: Context<AppEnv>,
  user: SessionUser,
): Promise<void> {
  const secret = getSessionSecret(c);
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await sign({ ...user, exp }, secret);

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSessionUser(
  c: Context<AppEnv>,
): Promise<SessionUser | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;

  try {
    const secret = getSessionSecret(c);
    const payload = await verify(token, secret, "HS256");
    return {
      email: payload.email as string,
      name: (payload.name as string | null) ?? null,
      picture: (payload.picture as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export function clearSession(c: Context<AppEnv>): void {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}
