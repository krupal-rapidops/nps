import { json, urlencoded } from "body-parser";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import cors from "cors";

// routes
import routes from "./routes";
import { errorHandler, rateLimiter } from "@moxfive-llc/common";

const app = express();

export function addMiddleWaresToApp() {
// middleware which blocks requests when we're too busy
    app.set("trust proxy", true);
    app.use(rateLimiter());
    app.use(helmet());
    app.use(json({
        limit: "20kb"
    }));
    app.use(urlencoded({
        extended: true,
        limit: "20kb"
    }));
    app.use(
        cors({
            origin: "*",
            credentials: true,
            preflightContinue: true
        }),
    );

    app.use(hpp());
    app.use(cookieParser(process.env.COOKIE_SECRET));

    app.use("/", routes);
    app.use(errorHandler);
}

export default app;
