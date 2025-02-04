import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { referenceValueMongooseSchemaV2, ReferenceValueV2 } from "@moxfive-llc/common";

// An interface that describes the properties that are required to create a new Action
interface ApplicationAttrs {
    id: string,
    user: ReferenceValueV2,
    organization: ReferenceValueV2,
    isEnabled?: boolean,
    isDeleted?: boolean,
    expiresIn: string,
    version?: number
}

// An interface that describes the properties that a Action Document has
interface ApplicationDoc extends mongoose.Document {
    id: string,
    user: ReferenceValueV2,
    organization: ReferenceValueV2,
    isEnabled: boolean,
    isDeleted: boolean,
    expiresIn: string,
    version: number
}

// An interface that describes the properties that a Action Model has
interface applicationModel extends mongoose.Model<ApplicationDoc> {
  build(attrs: ApplicationAttrs): ApplicationDoc
}

const applicationSchema = new mongoose.Schema(
    {
        user: {
            type: referenceValueMongooseSchemaV2("users"),
            required: true,
        },
        organization: {
            type: referenceValueMongooseSchemaV2("organizations"),
            required: true,
        },
        isEnabled: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        expiresIn: {
            type: Date,
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

applicationSchema.set("versionKey", "version");
applicationSchema.plugin(updateIfCurrentPlugin);

applicationSchema.statics.build = (attrs: ApplicationAttrs) => {
    return new Application({
        _id: attrs.id,
        user: attrs.user,
        organization: attrs.organization,
        isEnabled: attrs.isEnabled,
        isDeleted: attrs.isDeleted,
        expiresIn: attrs.expiresIn,
        version: attrs.version
    });
};

const Application = mongoose.model<ApplicationDoc, applicationModel>("Application", applicationSchema);

export { Application, ApplicationDoc, ApplicationAttrs };
