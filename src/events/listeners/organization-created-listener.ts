import { Listener, Subjects, OrganizationCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Organization } from "../../models/organization";

export class OrganizationCreatedListener extends Listener<OrganizationCreatedEvent> {
    subject: Subjects.OrganizationCreated = Subjects.OrganizationCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: OrganizationCreatedEvent["data"], msg: JsMsg) {
        await Organization.build(data).save();
        msg.ack();
    }
}
