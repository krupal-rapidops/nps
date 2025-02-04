import express from "express";
import { getNPSFormsRouter } from "./get-nps-forms/get-nps-forms";
import { submitResponsesRouter } from "./submit-responses/submit-responses";
import { getNPSStatusRouter } from "./get-nps-status/get-nps-status";
import { getEventLogStatisticsRouter } from "./get-event-log-statistics/get-event-log-statistics";

const router = express.Router();

router.use(getNPSFormsRouter);
router.use(getNPSStatusRouter);
router.use(submitResponsesRouter);
router.use(getEventLogStatisticsRouter);

export default router;
