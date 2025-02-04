import { Listener, Subjects, IncidentPolicyUpdatedEvent, ResourceNotFoundError, NotFoundCode } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Incident } from "../../models/incident";
import { queueGroupName } from "../queue-group-name";

export class IncidentPolicyUpdatedListener extends Listener<IncidentPolicyUpdatedEvent> {
    subject: Subjects.IncidentPolicyUpdated = Subjects.IncidentPolicyUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: IncidentPolicyUpdatedEvent["data"], msg: JsMsg) {
        const incident = await Incident.findById(data.id).lean().exec();

        if(!incident) {
            throw new ResourceNotFoundError(NotFoundCode.INCIDENT_NOT_FOUND, "Incident not found.");
        }
        // If current version is greater than provided version then acknowledge the event directly
        if (incident.version >= data.version) {
            msg.ack();
            return;
        }

        const { policyIds } = data;
        await Incident.findByIdAndUpdate(data.id, {
            _id: data.id,
            policyIds,
            version: data.version
        });
        msg.ack();
    }
}
