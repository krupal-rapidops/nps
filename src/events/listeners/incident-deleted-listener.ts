import { Listener, Subjects, IncidentDeletedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Incident } from "../../models/incident";

export class IncidentDeletedListener extends Listener<IncidentDeletedEvent> {
    subject: Subjects.IncidentDeleted = Subjects.IncidentDeleted;
    queueGroupName = queueGroupName;

    async onMessage(data: IncidentDeletedEvent["data"], msg: JsMsg) {
        const { id } = data;

        await Incident.findByIdAndDelete(id).lean().exec();
        msg.ack();
    }
}
