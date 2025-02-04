import { Listener, Subjects, PolicyDeletedEvent, ResourceNotFoundError, NotFoundCode } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Policy } from "../../models/policy";
import { queueGroupName } from "../queue-group-name";

export class PolicyDeletedListener extends Listener<PolicyDeletedEvent> {
    subject: Subjects.PolicyDeleted = Subjects.PolicyDeleted;
    queueGroupName = queueGroupName;

    async onMessage(data: PolicyDeletedEvent["data"], msg: JsMsg) {
        const policy = await Policy.findById(data.id);

        if (!policy) {
            throw new ResourceNotFoundError(NotFoundCode.POLICY_NOT_FOUND, "Policy not found.");
        }

        await Policy.deleteOne({ _id: data.id });
        msg.ack();
    }
}
