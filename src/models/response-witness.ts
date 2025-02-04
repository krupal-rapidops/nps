import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

interface responses {
    id: string,
    value: string | number,
}

// An interface that describes the properties to define a new ResponseWitness.
interface ResponseWitnessAttrs {
    organizationId: string,
    responses: responses[] | null,
    skipped: boolean
}

// An interface that describes the properties that ResponseWitness Document has
interface ResponseWitnessDoc extends mongoose.Document {
    id: string,
    organizationId: string,
    responses: responses[] | null,
    skipped: boolean,
    createdAt: string,
    updatedAt: string,
    version: number
}

// An interface that describes the properties that a ResponseWitness model has
interface ResponseWitnessModel extends mongoose.Model<ResponseWitnessDoc> {
    build(attrs: ResponseWitnessAttrs): ResponseWitnessDoc
}

const responsesSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Question"
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { _id: false });

const responseWitnessSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Organization"
        },
        responses: {
            type: [responsesSchema],
            default: null
        },
        skipped: {
            type: Boolean,
            required: true,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        updatedAt: {
            type: Date,
            default: Date.now()
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

responseWitnessSchema.set("versionKey", "version");
responseWitnessSchema.plugin(updateIfCurrentPlugin);

responseWitnessSchema.statics.build = (attrs: ResponseWitnessAttrs) => {
    return new ResponseWitness(attrs);
};

const ResponseWitness = mongoose.model<ResponseWitnessDoc, ResponseWitnessModel>("ResponseWitness", responseWitnessSchema);

export { ResponseWitness, ResponseWitnessDoc, responses };
