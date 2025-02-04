import { Listener, Subjects, ApplicationCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Application } from "../../models/application";

export class ApplicationCreatedListener extends Listener<ApplicationCreatedEvent> {
    subject: Subjects.ApplicationCreated = Subjects.ApplicationCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: ApplicationCreatedEvent["data"], msg: JsMsg) {
        await Application.build(data).save();
        msg.ack();
    }
}
