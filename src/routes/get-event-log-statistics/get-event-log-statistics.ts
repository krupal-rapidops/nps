import express, { NextFunction, Request, Response } from "express";
import {
    currentUser,
    getEventLogStatistics,
    requireAuth
} from "@moxfive-llc/common";

const router = express.Router();

router.get("/v1/nps/eventmessagelogs/stats",
    currentUser,
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const resp = await getEventLogStatistics();

            res.send(resp);
        }
        catch (error) {
            console.error("NPS.GetEventLogStatistics");
            console.error(error);
            next(error);
        }
    });

export { router as getEventLogStatisticsRouter };
