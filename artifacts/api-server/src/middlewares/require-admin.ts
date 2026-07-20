import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";
import { getSessionUser } from "../lib/session";

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  return next();
};
