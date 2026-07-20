import { Hono } from "hono";
import type { AppEnv } from "../types";
import healthRouter from "./health";
import authRouter from "./auth";
import startupsRouter from "./startups";
import partnerRouter from "./partner";
import adminRouter from "./admin";

const router = new Hono<AppEnv>();

router.route("/", healthRouter);
router.route("/", authRouter);
router.route("/", startupsRouter);
router.route("/", partnerRouter);
router.route("/", adminRouter);

export default router;
