import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { ProjectTypesEnum } from "../enums/project-types.enum";

interface witnesses {
    type: string,
    projectTypes: ProjectTypesEnum[],
    questions: string[],
}

// An interface that describes the properties to define a new RespondentQuestionsMap.
interface RespondentQuestionsMapAttrs {
    respondentType: string,
    witnesses: witnesses[],
    priority: number,
}

// An interface that describes the properties that RespondentQuestionsMap Document has
interface RespondentQuestionsMapDoc extends mongoose.Document {
    id: string,
    respondentType: string,
    witnesses: witnesses[],
    priority: number,
    createdAt: string,
    updatedAt: string,
    version: number
}

// An interface that describes the properties that a RespondentQuestionsMap model has
interface RespondentQuestionsMapModel extends mongoose.Model<RespondentQuestionsMapDoc> {
    build(attrs: RespondentQuestionsMapAttrs): RespondentQuestionsMapDoc
}

const witnessesSchema = new mongoose.Schema({
    type: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "OrganizationType"
    },
    projectTypes: {
        type: [String],
        required: true
    },
    questions: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        ref: "Question"
    }
}, { _id: false });

const respondentQuestionsMapSchema = new mongoose.Schema(
    {
        respondentType: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "OrganizationType",
            unique: true
        },
        witnesses: {
            type: [witnessesSchema],
            required: true
        },
        priority: {
            type: Number,
            required: true
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

respondentQuestionsMapSchema.set("versionKey", "version");
respondentQuestionsMapSchema.plugin(updateIfCurrentPlugin);

respondentQuestionsMapSchema.statics.build = (attrs: RespondentQuestionsMapAttrs) => {
    return new RespondentQuestionsMap(attrs);
};

const RespondentQuestionsMap = mongoose.model<RespondentQuestionsMapDoc, RespondentQuestionsMapModel>("RespondentQuestionsMap", respondentQuestionsMapSchema);

export { RespondentQuestionsMap, RespondentQuestionsMapDoc, witnesses };
