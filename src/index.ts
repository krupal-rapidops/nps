import { InternalServerError, natsConnection, loadSecrets, Secrets } from "@moxfive-llc/common";
import "express-async-errors";
import mongoose from "mongoose";

import app, { addMiddleWaresToApp } from "./app";
import { IncidentCreatedListener } from "./events/listeners/incident-created-listener";
import { IncidentDeletedListener } from "./events/listeners/incident-deleted-listener";
import { IncidentMembersRemovedListener } from "./events/listeners/incident-members-removed-listener";
import { IncidentPolicyUpdatedListener } from "./events/listeners/incident-policy-updated";
import { IncidentUpdatedListener } from "./events/listeners/incident-updated-listener";
import { OrganizationCreatedListener } from "./events/listeners/organization-created-listener";
import { OrganizationUpdatedListener } from "./events/listeners/organization-updated-listener";
import { PolicyCreatedListener } from "./events/listeners/policy-created-listener";
import { PolicyDeletedListener } from "./events/listeners/policy-deleted-listener";
import { PolicyUpdatedListener } from "./events/listeners/policy-updated-listener";
import { TrackerCreatedListener } from "./events/listeners/tracker-created-listener";
import { TrackerDeletedListener } from "./events/listeners/tracker-deleted-listener";
import { TrackerMembersRemovedListener } from "./events/listeners/tracker-members-removed-listener";
import { TrackerPolicyUpdatedListener } from "./events/listeners/tracker-policy-updated";
import { TrackerUpdatedListener } from "./events/listeners/tracker-updated-listener";
import { UserCreatedListener } from "./events/listeners/user-created-listener";
import { UserDeletedListener } from "./events/listeners/user-deleted-listener";
import { UserPolicyUpdatedListener } from "./events/listeners/user-policy-updated-listener";
import { UserUpdatedListener } from "./events/listeners/user-updated-listener";
import { natsWrapper } from "./nats-wrapper";
import { UserAgreementSignedListener } from "./events/listeners/user-agreement-signed-listener";
import { ApplicationCreatedListener } from "./events/listeners/application-created-listener";
import { ApplicationUpdatedListener } from "./events/listeners/application-updated-listener";

const main = async () => {
    try {
        await loadSecrets([
            Secrets.MONGO_URI,
            Secrets.MOXFIVE_ID,
            Secrets.COOKIE_SECRET,
            Secrets.JWT_SECRET,
            Secrets.SUPER_ADMIN_POLICY_ID
        ]);
        addMiddleWaresToApp();
        await handleValidationError();
        await connectDatabase();
        await handleNatsListener();
    }
    catch (error) {
        console.info(error);
        throw new InternalServerError();
    }
};

/**
 * @method handleValidationError
 * @description This will handle the validation error for all the env variable keys
 */
const handleValidationError = () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be defined");
    }
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be defined");
    }

    if (!process.env.COOKIE_SECRET) {
        throw new Error("COOKIE_SECRET must be defined");
    }
};
/**
 * @method connectDatabase
 * @description This function will perform the Database connection via Mongo URI
 */
const connectDatabase = async () => {
    mongoose.set("strictQuery", true);
    mongoose.set("toJSON", { flattenMaps: false });
    //mongoose.set("sanitizeFilter", true);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: "nps"
    });
    console.info("connect to db successfully.");
};
/**
 * @method handleNatsListener
 * @description This function is used to handle the NATS Listeners.
 */
const handleNatsListener = async () => {
    await natsWrapper.connect();
    natsConnection.setClient(natsWrapper.client);
    new UserCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new UserUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new UserDeletedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new UserPolicyUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new OrganizationCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new OrganizationUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new PolicyCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new PolicyUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new PolicyDeletedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new IncidentCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new IncidentUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new IncidentDeletedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new IncidentMembersRemovedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new IncidentPolicyUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new TrackerCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new TrackerUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new TrackerDeletedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new TrackerMembersRemovedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new TrackerPolicyUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info(error);
    });
    new UserAgreementSignedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info("User agreement assigned error:", error);
    });
    new ApplicationCreatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info("Application created listener error", JSON.stringify(error));
    });
    new ApplicationUpdatedListener(natsWrapper.client).listen().then().catch((error) => {
        console.info("Application updated listener error", JSON.stringify(error));
    });
};

main().then(() => {
    app.listen(3000, () => {
        console.info("Listening on port 3000!!!!");
    });
}).catch((error) => {
    console.info(error.reason);
});

process.on("uncaughtException", err => {
    console.error(err && err.stack);
});

// const exitHandler = async () => {
//     // Disconnect mongoDB connection
//     try {
//         await mongoose.connection.close(true);
//         console.info("DB disconnected successfully");
//     }
//     catch (err) {
//         console.info("Something went wrong while mongoDB disconnect", err);
//     }
//     finally {
//         process.exit();
//     }
// };
//
// [
//     "unhandledRejection", "SIGHUP", "SIGINT", "SIGQUIT", "SIGILL", "SIGTRAP", "SIGABRT", "SIGBUS", "SIGFPE", "SIGUSR1", "SIGSEGV", "SIGUSR2", "SIGTERM",
// ].forEach(evt => process.on(evt, exitHandler));
