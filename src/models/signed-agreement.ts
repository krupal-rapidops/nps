import mongoose from "mongoose";

interface SignedAgreementAttrs {
    id: string,
    agreementId: string,
    userId: string,
    createdAt: string
}

interface SignedAgreementDoc extends mongoose.Document {
    id: string,
    agreementId: string,
    userId: string,
    createdAt: string
}

interface SignedAgreementModel extends mongoose.Model<SignedAgreementDoc> {
    build(attrs: SignedAgreementAttrs): SignedAgreementDoc
}

const signedAgreementSchema = new mongoose.Schema(
    {
        agreementId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
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

signedAgreementSchema.statics.build = (attrs: SignedAgreementAttrs) => {
    return new SignedAgreement({
        ...attrs,
        _id: attrs.id
    });
};

const SignedAgreement = mongoose.model<SignedAgreementDoc, SignedAgreementModel>("SignedAgreement", signedAgreementSchema);

export { SignedAgreement, SignedAgreementDoc, SignedAgreementAttrs };
