import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties that are required to create a new Policy
interface PolicyAttrs {
  id: string,
  name: string,
  isEnabled: boolean,
  actionIds: string[],
  type: "Global" | "Application";
  version: number
}

interface PolicyEventAttr {
  id: string;
  version: number;
}

// An interface that describes the properties that a Policy Document has
interface PolicyDoc extends mongoose.Document {
  id: string,
  name: string,
  isEnabled: boolean,
  actionIds: string[],
  type: "Global" | "Application";
  version: number
}

// An interface that describes the properties that a Policy Model has
interface PolicyModel extends mongoose.Model<PolicyDoc> {
  build(attrs: PolicyAttrs): PolicyDoc,
  findByEvent(event: PolicyEventAttr): Promise<PolicyDoc>
}

const policySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true
        },
        isEnabled: {
            type: Boolean,
            default: true,
            required: true
        },
        actionIds: {
            type: [mongoose.Types.ObjectId],
            ref: "Action",
            required: true
        },
        type: {
            type: String,
            required: true
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

policySchema.set("versionKey", "version");
policySchema.plugin(updateIfCurrentPlugin);

policySchema.statics.build = (attrs: PolicyAttrs) => {
    return new Policy({
        _id: attrs.id,
        name: attrs.name,
        version: attrs.version,
        isEnabled: attrs.isEnabled,
        actionIds: attrs.actionIds,
        type: attrs.type
    });
};

policySchema.statics.findByEvent = (event: PolicyEventAttr) => {
    return Policy.findOne({ _id: event.id, version: event.version - 1 });
};

const Policy = mongoose.model<PolicyDoc, PolicyModel>("Policy", policySchema);

export { Policy, PolicyDoc, PolicyAttrs };
