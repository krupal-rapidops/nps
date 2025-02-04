import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties to define a new response.
interface ResponseAttrs {
    userId: string,
    projectId: string,
    completed: boolean,
    witnesses: string[]
}

// An interface that describes the properties that Response Document has
interface ResponseDoc extends mongoose.Document {
    id: string,
    userId: string,
    projectId: string,
    completed: boolean,
    witnesses: string[]
    createdAt: string,
    updatedAt: string,
    version: number
}

// An interface that describes the properties that a Response model has
interface ResponseModel extends mongoose.Model<ResponseDoc> {
    build(attrs: ResponseAttrs): ResponseDoc
}

const responseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        completed: {
            type: Boolean,
            required: true
        },
        witnesses: {
            type: [mongoose.Schema.Types.ObjectId],
            required: true,
            default: [],
            ref: "ResponseWitness"
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

responseSchema.set("versionKey", "version");
responseSchema.plugin(updateIfCurrentPlugin);
responseSchema.index({ projectId: 1, userId: 1 }, { unique: true });

responseSchema.statics.build = (attrs: ResponseAttrs) => {
    return new Responses(attrs);
};

const Responses = mongoose.model<ResponseDoc, ResponseModel>("Response", responseSchema);

export { Responses, ResponseDoc };
