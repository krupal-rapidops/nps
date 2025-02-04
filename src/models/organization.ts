import mongoose from "mongoose";
import { ObjectId } from "bson";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties that are required to create a new organization
interface OrganizationAttr {
    id: string;
    name: string;
    organizationTypeIds: string[];
    isEnabled: boolean;
    version: number
}

interface OrganizationEventAttr {
    id:string;
    version:number;
}

// An interface that describes the properties that a organization Document has
interface OrganizationDoc extends mongoose.Document {
    id: string;
    name: string;
    organizationTypeIds: ObjectId[];
    isEnabled: boolean;
    version: number;
}

// An interface that describes the properties that a organization Model has
interface OrganizationModel extends mongoose.Model<OrganizationDoc> {
    build(attrs: OrganizationAttr): OrganizationDoc;
    findByEvent(event: OrganizationEventAttr): Promise<OrganizationDoc>
}

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        organizationTypeIds: {
            type: [mongoose.Schema.Types.ObjectId],
            required: true,
            ref: "OrganizationType"
        },
        isEnabled: {
            type: Boolean,
            required: true
        }
    },
    {
        toJSON: {
            transform(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
            }
        }
    }
);

organizationSchema.set("versionKey", "version");
organizationSchema.plugin(updateIfCurrentPlugin);

organizationSchema.statics.build = (attrs: OrganizationAttr) => {
    return new Organization({
        _id: attrs.id,
        name: attrs.name,
        organizationTypeIds: attrs.organizationTypeIds,
        isEnabled: attrs.isEnabled,
        version: attrs.version
    });
};

organizationSchema.statics.findByEvent = (event: OrganizationEventAttr) => {
    return Organization.findOne({ _id: event.id, version: event.version - 1 });
};

const Organization = mongoose.model<OrganizationDoc, OrganizationModel>("Organization", organizationSchema);

export { Organization, OrganizationDoc, OrganizationAttr };
