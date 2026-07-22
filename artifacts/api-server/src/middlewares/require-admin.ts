import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";
import { getAdminUser } from "../lib/auth-user";

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await getAdminUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  return next();
};
