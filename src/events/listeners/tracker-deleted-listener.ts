import { Listener, Subjects, TrackerDeletedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Tracker } from "../../models/tracker";
import { queueGroupName } from "../queue-group-name";

export class TrackerDeletedListener extends Listener<TrackerDeletedEvent> {
    subject: Subjects.TrackerDeleted = Subjects.TrackerDeleted;
    queueGroupName = queueGroupName;

    async onMessage(data: TrackerDeletedEvent["data"], msg: JsMsg) {
        const { id } = data;

        await Tracker.findByIdAndDelete(id).lean().exec();
        msg.ack();
    }
}
