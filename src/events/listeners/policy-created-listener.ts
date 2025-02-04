import { Listener, Subjects, PolicyCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Policy } from "../../models/policy";
import { queueGroupName } from "../queue-group-name";

export class PolicyCreatedListener extends Listener<PolicyCreatedEvent> {
    subject: Subjects.PolicyCreated = Subjects.PolicyCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: PolicyCreatedEvent["data"], msg: JsMsg) {
        await Policy.build(data).save();
        msg.ack();
    }
}
