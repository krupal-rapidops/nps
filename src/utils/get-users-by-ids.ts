import { getUserName } from "./index";
import { User } from "../models/user";

export const getUsersByIds = async (usersIds: string[]) => {
    const userIds = new Set([...usersIds]);
    const modifiedByUsers = await User.find({ _id: [...userIds] }, { firstName: 1, lastName: 1, displayName: 1, policyIds: 1 }).lean().exec();
    const modifiedByUsersMap = new Map();
    modifiedByUsers.forEach(user =>
        modifiedByUsersMap.set(
            String(user._id),
            getUserName(
                {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    displayName: user.displayName
                }
            )
        )
    );

    return modifiedByUsersMap;
};
