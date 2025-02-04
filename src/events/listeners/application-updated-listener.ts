import { Listener, Subjects, ApplicationUpdatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Application } from "../../models/application";

export class ApplicationUpdatedListener extends Listener<ApplicationUpdatedEvent> {
    subject: Subjects.ApplicationUpdated = Subjects.ApplicationUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: ApplicationUpdatedEvent["data"], msg: JsMsg) {
        const client = await Application.findById(data.id).lean().exec();
        // If current version is greater than provided version then acknowledge the event directly
        if (client && client.version >= data.version) {
            msg.ack();
            return;
        }
        await Application.findByIdAndUpdate(data.id, {
            _id: data.id,
            user: data.user,
            organization: data.organization,
            isEnabled: data.isEnabled,
            isDeleted: data.isDeleted,
            expiresIn: data.expiresIn,
            version: data.version
        }, { upsert: true });

        msg.ack();
    }
}
