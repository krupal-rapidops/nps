/* eslint-disable no-await-in-loop  */
import { Listener, Subjects, ResourceNotFoundError, NotFoundCode, IncidentMembersRemovedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Incident } from "../../models/incident";

export class IncidentMembersRemovedListener extends Listener<IncidentMembersRemovedEvent> {
    subject: Subjects.IncidentMembersRemoved = Subjects.IncidentMembersRemoved;
    queueGroupName = queueGroupName;

    async onMessage(data: IncidentMembersRemovedEvent["data"], msg: JsMsg) {
        const incident = await Incident.findById(data.id).lean().exec();

        if(!incident) {
            throw new ResourceNotFoundError(NotFoundCode.INCIDENT_NOT_FOUND, "Incident not found.");
        }
        // If current version is greater than provided version then acknowledge the event directly
        if (incident.version >= data.version) {
            msg.ack();
            return;
        }
        const { members } = data;
        await Incident.findByIdAndUpdate(data.id, {
            _id: data.id,
            members,
            version: data.version
        });
        msg.ack();
    }
}
