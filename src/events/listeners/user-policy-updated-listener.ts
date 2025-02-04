import { Listener, Subjects, UserPolicyUpdatedEvent, ResourceNotFoundError, NotFoundCode } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { User } from "../../models/user";
import { queueGroupName } from "../queue-group-name";

export class UserPolicyUpdatedListener extends Listener<UserPolicyUpdatedEvent> {
    subject: Subjects.UserPolicyUpdated = Subjects.UserPolicyUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: UserPolicyUpdatedEvent["data"], msg: JsMsg) {
        const user = await User.findById(data.id).lean().exec();

        if(!user) {
            throw new ResourceNotFoundError(NotFoundCode.USER_NOT_FOUND, "User not found.");
        }
        // If current version is greater than provided version then acknowledge the event directly
        if (user.version >= data.version) {
            msg.ack();
            return;
        }

        const { policyIds, applicationPolicyIds } = data;
        await User.findByIdAndUpdate(data.id, {
            _id: data.id,
            policyIds, applicationPolicyIds,
            version: data.version
        });
        msg.ack();
    }
}
