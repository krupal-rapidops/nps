import { Listener, Subjects, PolicyUpdatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Policy } from "../../models/policy";
import { queueGroupName } from "../queue-group-name";

export class PolicyUpdatedListener extends Listener<PolicyUpdatedEvent> {
    subject: Subjects.PolicyUpdated = Subjects.PolicyUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: PolicyUpdatedEvent["data"], msg: JsMsg) {
        const policy = await Policy.findById(data.id).lean().exec();

        // If current version is greater than provided version then acknowledge the event directly
        if (policy && policy.version >= data.version) {
            msg.ack();
            return;
        }

        const { name, isEnabled, actionIds, type } = data;
        await Policy.findByIdAndUpdate(data.id, {
            _id: data.id,
            name, isEnabled, actionIds, type,
            version: data.version
        }, { upsert: true });
        msg.ack();
    }
}
