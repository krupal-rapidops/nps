import { Listener, Subjects, TrackerPolicyUpdatedEvent, ResourceNotFoundError, NotFoundCode } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { Tracker } from "../../models/tracker";
import { queueGroupName } from "../queue-group-name";

export class TrackerPolicyUpdatedListener extends Listener<TrackerPolicyUpdatedEvent> {
    subject: Subjects.TrackerPolicyUpdated = Subjects.TrackerPolicyUpdated;
    queueGroupName = queueGroupName;

    async onMessage(data: TrackerPolicyUpdatedEvent["data"], msg: JsMsg) {
        const tracker = await Tracker.findById(data.id).lean().exec();

        if(!tracker) {
            throw new ResourceNotFoundError(NotFoundCode.TRACKER_NOT_FOUND, "Tracker not found.");
        }
        // If current version is greater than provided version then acknowledge the event directly
        if (tracker.version >= data.version) {
            msg.ack();
            return;
        }

        const { policyIds } = data;
        await Tracker.findByIdAndUpdate(data.id, {
            _id: data.id,
            policyIds,
            version: data.version
        });
        msg.ack();
    }
}
