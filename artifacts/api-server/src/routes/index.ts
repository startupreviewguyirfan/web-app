import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import startupsRouter from "./startups";
import partnerRouter from "./partner";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(startupsRouter);
router.use(partnerRouter);
router.use(adminRouter);

export default router;
