import { Listener, NotFoundCode, ResourceNotFoundError, Subjects, UserDeletedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { User } from "../../models/user";
import { queueGroupName } from "../queue-group-name";

export class UserDeletedListener extends Listener<UserDeletedEvent> {
    subject: Subjects.UserDeleted = Subjects.UserDeleted;
    queueGroupName = queueGroupName;

    async onMessage(data: UserDeletedEvent["data"], msg: JsMsg) {
        const user = await User.findById(data.id);
        if (!user) {
            throw new ResourceNotFoundError(NotFoundCode.USER_NOT_FOUND, "User not found");
        }
        await user.delete();
        msg.ack();
    }
}
