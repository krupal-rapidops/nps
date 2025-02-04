import { Listener, OrganizationUpdatedEvent, Subjects } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Organization } from "../../models/organization";

export class OrganizationUpdatedListener extends Listener<OrganizationUpdatedEvent> {
    subject: Subjects.OrganizationUpdated = Subjects.OrganizationUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: OrganizationUpdatedEvent["data"], msg: JsMsg) {
        const organization = await Organization.findById(data.id).lean().exec();

        // If current version is greater than provided version then acknowledge the event directly
        if (organization && organization.version >= data.version) {
            msg.ack();
            return;
        }
        const { name, organizationTypeIds, isEnabled } = data;
        await Organization.findByIdAndUpdate(data.id, {
            _id: data.id,
            name, organizationTypeIds, isEnabled,
            version: data.version
        }, { upsert: true });
        msg.ack();
    }
}
