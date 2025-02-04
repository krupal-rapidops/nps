import { Listener, Subjects, UserUpdatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { User } from "../../models/user";
import { queueGroupName } from "../queue-group-name";

export class UserUpdatedListener extends Listener<UserUpdatedEvent> {
    subject: Subjects.UserUpdated = Subjects.UserUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: UserUpdatedEvent["data"], msg: JsMsg) {
        const user = await User.findById(data.id).lean().exec();
        // If current version is greater than provided version then acknowledge the event directly
        if (user && user.version >= data.version) {
            msg.ack();
            return;
        }
        const { firstName, lastName, email, displayName, organizationId, isEnabled, name } = data;
        await User.findByIdAndUpdate(data.id, {
            _id: data.id,
            firstName, lastName, email, displayName, organizationId, isEnabled, name,
            version: data.version
        }, { upsert: true });
        msg.ack();
    }
}
