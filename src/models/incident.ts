import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties to define a new Incident
interface IncidentAttrs {
    id: string,
    name: string,
    clientId: string,
    published: boolean,
    members: string[] | [],
    policyIds: string[] | [],
    modules: {[key: string]: boolean},
    progressPercentage: number,
    version: number
}

interface IncidentEventAttr {
    id: string,
    version: number
}

// An interface that describes the properties that Incident Document has
interface IncidentDoc extends mongoose.Document {
    id: string,
    name: string,
    clientId: string,
    published: boolean,
    members: string[],
    policyIds: string[],
    modules: {[key: string]: boolean},
    progressPercentage: number,
    version: number
}

// An interface that describes the properties that a Incident model has
interface IncidentModel extends mongoose.Model<IncidentDoc> {
    build(attrs: IncidentAttrs): IncidentDoc,
    findByEvent(event: IncidentEventAttr): Promise<IncidentDoc>
}

const incidentSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },
        name: {
            type: String,
            unique: true,
            required: true
        },
        published: {
            type: Boolean,
            default: false
        },
        members: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        modules: {
            type: mongoose.SchemaTypes.Mixed, //Set object type
            required: true
        },
        policyIds: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Policy",
            default: []
        },
        progressPercentage: {
            type: Number,
            default: 0,
            required: true,
        },
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

incidentSchema.set("versionKey", "version");
incidentSchema.plugin(updateIfCurrentPlugin);

incidentSchema.statics.build = (attrs: IncidentAttrs) => {
    return new Incident({
        _id: attrs.id,
        name: attrs.name,
        clientId: attrs.clientId,
        published: attrs.published,
        members: attrs.members,
        policyIds: attrs.policyIds,
        modules: attrs.modules,
        progressPercentage: attrs.progressPercentage,
        version: attrs.version
    });
};

incidentSchema.statics.findByEvent = (event: IncidentEventAttr) => {
    return Incident.findOne({ _id: event.id, version: event.version - 1 });
};

const Incident = mongoose.model<IncidentDoc, IncidentModel>("Incident", incidentSchema);

export { Incident, IncidentDoc };
