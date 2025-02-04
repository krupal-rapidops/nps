import mongoose from "mongoose";

// An interface that describes the properties that an Action Document has
interface ActionDoc extends mongoose.Document {
  id: string,
  name: string,
  description: string,
  isEnabled: boolean,
  ruleIds: string[],
  serviceId: string,
  isModuleLevel: boolean,
  accessControlId: string,
  moxfiveExclusive: boolean,
  requireAuthorization: boolean
}

const actionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true
        },
        description: {
            type: String
        },
        isEnabled: {
            type: Boolean,
            default: true,
            required: true
        },
        ruleIds: {
            type: [mongoose.Types.ObjectId],
            ref: "Rule",
            required: true
        },
        serviceId: {
            type: mongoose.Types.ObjectId,
            ref: "Service",
            required: true
        },
        isModuleLevel: {
            type: Boolean,
            required: true
        },
        accessControlId: {
            type: mongoose.Types.ObjectId,
            ref: "AccessControl",
            required: true
        },
        moxfiveExclusive: {
            type: Boolean,
            required: true
        },
        requireAuthorization: {
            type: Boolean,
            default: true,
            required: true
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

const Action = mongoose.model<ActionDoc>("Action", actionSchema);

export { Action, ActionDoc };
