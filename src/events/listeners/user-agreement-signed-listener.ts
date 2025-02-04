import {
    Listener,
    Subjects,
    UserAgreementSignedEvent
} from "@moxfive-llc/common";
import { JsMsg } from "nats";
import { queueGroupName } from "../queue-group-name";
import { SignedAgreement } from "../../models/signed-agreement";
import { User } from "../../models/user";
import { Agreement } from "../../models/agreement";

export class UserAgreementSignedListener extends Listener<UserAgreementSignedEvent> {
    subject: Subjects.UserAgreementSigned = Subjects.UserAgreementSigned;
    queueGroupName = queueGroupName;

    async onMessage(data: UserAgreementSignedEvent["data"], msg: JsMsg) {
        const user = await User.findById(data.userId).lean().exec();
        const agreement = await Agreement.findById(data.agreementId).lean().exec();

        if(user && agreement) {
            await SignedAgreement.build(data).save();
        }
        msg.ack();
    }
}
