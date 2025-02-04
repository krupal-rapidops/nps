import { Listener, Subjects, TrackerUpdatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Tracker } from "../../models/tracker";

export class TrackerUpdatedListener extends Listener<TrackerUpdatedEvent> {
    subject: Subjects.TrackerUpdated = Subjects.TrackerUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: TrackerUpdatedEvent["data"], msg: JsMsg) {
        const tracker = await Tracker.findById(data.id).lean().exec();

        // If current version is greater than provided version then acknowledge the event directly
        if (tracker && tracker.version >= data.version) {
            msg.ack();
            return;
        }

        const { members, policyIds, name, clientId } = data;
        await Tracker.findByIdAndUpdate(data.id, {
            _id: data.id,
            members, policyIds, name, clientId,
            version: data.version
        }, { upsert: true });
        msg.ack();
    }
}
