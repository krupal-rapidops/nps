import { Listener, Subjects, ResourceNotFoundError, NotFoundCode, IncidentUpdatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Incident } from "../../models/incident";

export class IncidentUpdatedListener extends Listener<IncidentUpdatedEvent> {
    subject: Subjects.IncidentUpdated = Subjects.IncidentUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: IncidentUpdatedEvent["data"], msg: JsMsg) {
        const incident = await Incident.findById(data.id).lean().exec();

        // If current version is greater than provided version then acknowledge the event directly
        if (incident && incident.version >= data.version) {
            msg.ack();
            return;
        }
        const { published, members, policyIds, name, clientId, modules, progressPercentage } = data;
        await Incident.findByIdAndUpdate(data.id, {
            _id: data.id,
            published, members, policyIds, name, clientId, modules, progressPercentage,
            version: data.version
        }, { upsert: true });
        msg.ack();
    }
}
