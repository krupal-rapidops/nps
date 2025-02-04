import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties to define a new Organization type
interface OrganizationTypeAttrs {
  name: string;
}

// An interface that describes the properties that Organization Type Document has
interface OrganizationTypeDoc extends mongoose.Document {
  name: string;
  version: string;
  createdAt: string;
}

// An interface that describes the properties that a Organization Type model has
interface OrganizationTypeModel extends mongoose.Model<OrganizationTypeDoc> {
  build(attrs: OrganizationTypeAttrs): OrganizationTypeDoc,
  findByNames(names: string[]): Promise<OrganizationTypeDoc[]>,
  findByName(name: string): Promise<OrganizationTypeDoc>
}

const organizationTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true
        },
        createdAt: {
            type: Date,
            required: true,
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

organizationTypeSchema.set("versionKey", "version");
organizationTypeSchema.plugin(updateIfCurrentPlugin);

organizationTypeSchema.statics.build = (attrs: OrganizationTypeAttrs) => {
    return new OrganizationType(attrs);
};

organizationTypeSchema.statics.findByNames = async (names: string[]) => {
    const organizationTypes = await OrganizationType.find({ name: { $in: names } }).select("name");
    return organizationTypes;
};

organizationTypeSchema.statics.findByName = async (name: string) => {
    const organizationType = await OrganizationType.findOne({ name }).select("name").lean().exec();
    return organizationType;
};

const OrganizationType = mongoose.model<OrganizationTypeDoc, OrganizationTypeModel>("OrganizationType", organizationTypeSchema);

export { OrganizationType, OrganizationTypeDoc };
