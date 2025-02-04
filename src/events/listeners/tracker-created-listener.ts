import { Listener, Subjects, TrackerCreatedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Tracker } from "../../models/tracker";
import { queueGroupName } from "../queue-group-name";

export class TrackerCreatedListener extends Listener<TrackerCreatedEvent> {
    subject: Subjects.TrackerCreated = Subjects.TrackerCreated;
    queueGroupName = queueGroupName;

    async onMessage(data: TrackerCreatedEvent["data"], msg: JsMsg) {
        await Tracker.build(data).save();
        msg.ack();
    }
}
