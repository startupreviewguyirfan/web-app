import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppEnv } from "./types";
import { dbMiddleware } from "./lib/db-middleware";
import router from "./routes";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);
app.use("/api/*", dbMiddleware);

app.route("/api", router);

export default app;
