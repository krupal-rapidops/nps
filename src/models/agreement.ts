import mongoose from "mongoose";

interface AgreementAttrs {
    id: string,
    title: string,
    metadata: string,
    type: "Platform" | "Feature",
    version: string,
    retired: boolean,
    createdAt: string
}

interface AgreementDoc extends mongoose.Document {
    id: string,
    title: string,
    metadata: string,
    type: "Platform" | "Feature",
    version: string,
    retired: boolean,
    createdAt: string
}

interface AgreementModel extends mongoose.Model<AgreementDoc> {
    build(attrs: AgreementAttrs): AgreementDoc
}

const agreementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        metadata: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        version: {
            type: String,
            required: true
        },
        retired: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
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

agreementSchema.statics.build = (attrs: AgreementAttrs) => {
    return new Agreement(attrs);
};

const Agreement = mongoose.model<AgreementDoc, AgreementModel>("Agreement", agreementSchema);

export { Agreement, AgreementDoc, AgreementAttrs };
