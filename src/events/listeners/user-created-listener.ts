import { Listener, Subjects, UserCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { User } from "../../models/user";
import { queueGroupName } from "../queue-group-name";

export class UserCreatedListener extends Listener<UserCreatedEvent> {
    subject: Subjects.UserCreated = Subjects.UserCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: UserCreatedEvent["data"], msg: JsMsg) {
        await User.build(data).save();
        msg.ack();
    }
}
