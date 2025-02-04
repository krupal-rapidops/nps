import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { QuestionPlaceholdersEnum } from "../enums/question-placeholders.enum";

// An interface that describes the properties to define a new question placeholder.
interface QuestionPlaceholderAttrs {
    name: QuestionPlaceholdersEnum
}

// An interface that describes the properties that QuestionPlaceholder Document has
interface QuestionPlaceholderDoc extends mongoose.Document {
    id: string,
    name: QuestionPlaceholdersEnum,
    createdAt: string,
    updatedAt: string,
    version: number
}

// An interface that describes the properties that a QuestionPlaceholder model has
interface QuestionPlaceholderModel extends mongoose.Model<QuestionPlaceholderDoc> {
    build(attrs: QuestionPlaceholderAttrs): QuestionPlaceholderDoc
}

const questionPlaceholderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
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

questionPlaceholderSchema.set("versionKey", "version");
questionPlaceholderSchema.plugin(updateIfCurrentPlugin);

questionPlaceholderSchema.statics.build = (attrs: QuestionPlaceholderAttrs) => {
    return new QuestionPlaceholder(attrs);
};

const QuestionPlaceholder = mongoose.model<QuestionPlaceholderDoc, QuestionPlaceholderModel>("QuestionPlaceholder", questionPlaceholderSchema);

export { QuestionPlaceholder, QuestionPlaceholderDoc };
