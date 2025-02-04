import { Listener, Subjects, IncidentCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Incident } from "../../models/incident";

export class IncidentCreatedListener extends Listener<IncidentCreatedEvent> {
    subject: Subjects.IncidentCreated = Subjects.IncidentCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: IncidentCreatedEvent["data"], msg: JsMsg) {
        await Incident.build(data).save();
        msg.ack();
    }
}
