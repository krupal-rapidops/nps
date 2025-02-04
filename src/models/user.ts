import { ApplicationPolicyIdObj } from "@moxfive-llc/common/build/interfaces";
import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// An interface that describes the properties
// that are required to create a new Role
interface UserAttr {
    id: string;
    name?: string | null,
    firstName: string | null;
    lastName: string | null;
    displayName?: string,
    email: string;
    organizationId: string | null;
    version: number;
    isEnabled: boolean;
}

interface UserEventAttr {
    id:string;
    version:number;
}

// An interface that describes the properties
// that a Role Model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttr): UserDoc;
  findByEvent(event: UserEventAttr): Promise<UserDoc>
}

// An interface that describes the properties
// that a Role Document has
interface UserDoc extends mongoose.Document {
    id: string;
    name: string | null,
    firstName: string;
    lastName: string;
    displayName: string,
    email: string;
    organizationId: string;
    policyIds: string[];
    version: number;
    isEnabled: boolean;
    applicationPolicyIds: ApplicationPolicyIdObj[];
}

const applicationPolicySchema = new mongoose.Schema({
    applicationType: {
        type: String,
        enum: ["Incident", "Resilience"],
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "applicationType"
    },
    policyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CommonPolicy"
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: null
    },
    firstName: {
        type: String,
        default: null
    },
    lastName: {
        type: String,
        default: null
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null
    },
    policyIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Policy"
    },
    isEnabled: {
        type: Boolean,
        required: true
    },
    applicationPolicyIds: {
        type: [applicationPolicySchema],
        default: []
    }
},
{
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});

userSchema.set("versionKey", "version");
userSchema.plugin(updateIfCurrentPlugin);

userSchema.statics.build = (attrs: UserAttr) => {
    return new User({
        _id: attrs.id,
        name: attrs.name,
        firstName: attrs.firstName,
        lastName: attrs.lastName,
        displayName: attrs.displayName,
        email: attrs.email,
        organizationId: attrs.organizationId,
        isEnabled: attrs.isEnabled,
        version: attrs.version
    });
};

userSchema.statics.findByEvent = (event: UserEventAttr) => {
    return User.findOne({ _id: event.id, version: event.version - 1 });
};

const User = mongoose.model<UserDoc, UserModel>("users", userSchema);
export { User, UserDoc };
