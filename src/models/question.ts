import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { QuestionTypeEnum } from "../enums/question-type.enum";

// An interface that describes the properties to define a new question.
interface QuestionAttrs {
    title: string,
    type: QuestionTypeEnum,
    placeholders: string[],
    required: boolean,
}

// An interface that describes the properties that Question Document has
interface QuestionDoc extends mongoose.Document {
    id: string,
    title: string,
    type: QuestionTypeEnum,
    placeholders: string[],
    required: boolean,
    createdAt: string,
    updatedAt: string,
    version: number
}

// An interface that describes the properties that a Question model has
interface QuestionModel extends mongoose.Model<QuestionDoc> {
    build(attrs: QuestionAttrs): QuestionDoc
}

const questionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        placeholders: {
            type: [mongoose.Schema.Types.ObjectId],
            required: true,
            ref: "QuestionPlaceholder",
            default: []
        },
        required: {
            type: String,
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

questionSchema.set("versionKey", "version");
questionSchema.plugin(updateIfCurrentPlugin);

questionSchema.statics.build = (attrs: QuestionAttrs) => {
    return new Question(attrs);
};

const Question = mongoose.model<QuestionDoc, QuestionModel>("Question", questionSchema);

export { Question, QuestionDoc };
