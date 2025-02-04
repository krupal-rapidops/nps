/* eslint-disable no-await-in-loop  */
import { Listener, Subjects, ResourceNotFoundError, NotFoundCode, TrackerMembersRemovedEvent } from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { Tracker } from "../../models/tracker";

export class TrackerMembersRemovedListener extends Listener<TrackerMembersRemovedEvent> {
    subject: Subjects.TrackerMembersRemoved = Subjects.TrackerMembersRemoved;
    queueGroupName = queueGroupName;

    async onMessage(data: TrackerMembersRemovedEvent["data"], msg: JsMsg) {
        const tracker = await Tracker.findById(data.id).lean().exec();
        if(!tracker) {
            throw new ResourceNotFoundError(NotFoundCode.TRACKER_NOT_FOUND, "Tracker not found.");
        }

        // If current version is greater than provided version then acknowledge the event directly
        if (tracker.version >= data.version) {
            msg.ack();
            return;
        }
        const { members } = data;
        await Tracker.findByIdAndUpdate(data.id, {
            _id: data.id,
            members,
            version: data.version
        });
        msg.ack();
    }
}
