import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface TrackerAttrs {
    id: string;
    version: number;
    name: string;
    clientId: string;
    policyIds?: string[];
    members?: string[];
}

interface TrackerEventAttr {
    id: string,
    version: number
}

interface TrackerDoc extends mongoose.Document {
    id: string;
    name: string;
    clientId: string;
    policyIds: string[];
    members: string[];
    version: number;
}

interface TrackerModel extends mongoose.Model<TrackerDoc> {
    build(attrs: TrackerAttrs): TrackerDoc;
    findByEvent(event: TrackerEventAttr): Promise<TrackerDoc>;
}

const trackerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            unique: true,
            ref: "Organization",
            required: true,
        },
        policyIds: {
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
            ref: "Policy"
            // To Do: Add ref of policy model
        },
        members: {
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
            ref: "User"
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    }
);

trackerSchema.set("versionKey", "version");
trackerSchema.plugin(updateIfCurrentPlugin);

trackerSchema.statics.build = (attrs: TrackerAttrs) => {
    return new Tracker({
        _id: attrs.id,
        version: attrs.version,
        name: attrs.name,
        clientId: attrs.clientId,
        policyIds: attrs.policyIds,
        members: attrs.members
    });
};

trackerSchema.statics.findByEvent = (event: TrackerEventAttr) => {
    return Tracker.findOne({ _id: event.id, version: event.version - 1 });
};

const Tracker = mongoose.model<TrackerDoc, TrackerModel>("Tracker", trackerSchema);

export { Tracker, TrackerAttrs, TrackerDoc };
