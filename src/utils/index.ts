import { InsufficientPrivilagesError } from "@moxfive-llc/common";
import mongoose from "mongoose";

export interface queryObject {
    page: number,
    limit: number,
    search: string
}

export const defaultLimit = 100;
export const defaultPage = 1;
const hasProtocol = new RegExp("^([a-z]+://|//)", "i");

export const isValidMongoObjectId = (id: string) => {
    return mongoose.isObjectIdOrHexString(id);
};

export const getUserName = ({ firstName, lastName, displayName } : {firstName: string | null, lastName: string | null, displayName: string}) => {
    if(!firstName && !lastName) {
        return displayName;
    }
    let name = "";
    if(firstName) {
        name += firstName;
        if(lastName) {
            name += " ";
        }
    }
    if(lastName) {
        name += lastName;
    }
    return name;
};

export const getUserInitials = ({
    firstName,
    lastName,
    displayName,
    email
}: {
    firstName: string | null,
    lastName: string | null,
    displayName: string,
    email: string,
}) => {
    const userInitials: string[] = [];

    // If firstname or last name is present then add first character of it in userInitials array
    if(firstName || lastName) {
        firstName ? userInitials.push(firstName.charAt(0)) : null;
        lastName ? userInitials.push(lastName.charAt(0)) : null;
    }
    // If displayName is present then add first character of it in userInitials
    else if(displayName) {
        userInitials.push(displayName.charAt(0));
    }
    // Otherwise add email first character in userInitials
    else {
        userInitials.push(email.charAt(0));
    }

    return userInitials.join("");
};

export const escapeRegExp = (s: string) => {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const pickFromObject = (obj: any, fields: string[], includeNullIfNotFound = true) => {
    const result: any = {};
    for (const field of fields) {
        result[String(field)] = obj[String(field)] ?? (includeNullIfNotFound ? null : undefined);
    }
    return result;
};

export const intersectTwoObjects = (from: any, to: any) => {
    const result: any = {};
    for (const param in from) {
        if (to.hasOwnProperty(param) && JSON.stringify(to[String(param)]) !== JSON.stringify(from[String(param)])) {
            result[String(param)] = to[String(param)];
        }
    }
    return result;
};

export const hasWhiteSpace = (str: string) => {
    return (/\s/).test(str);
};

export const maxAllowedNumber = (noOfDigits = 1) => {
    return Number("9".repeat(noOfDigits));
};

export const sortByPropertyInObject = (property: string) => {
    return (a: {[key: string]: any}, b: {[key: string]: any}) => a[String(property)].localeCompare(b[String(property)]);
};

export const restrictSpacesAfterPeriod = (number: number, spaces = 2) => {
    const splitNumber = String(number).split(".");
    if (splitNumber.length > 2) {
        return false;
    }

    if (splitNumber.length === 2 && splitNumber[1].length > +spaces) {
        return false;
    }

    return true;
};

const doesURIContainsProtocol = (str: string) => {
    return hasProtocol.test(str);
};

export const sanitizeURL = (URIString: string) => {
    let sanitizedString = URIString;
    if (doesURIContainsProtocol(sanitizedString)) {
        sanitizedString = sanitizedString.replace(/tt/, "xx");
        // eslint-disable-next-line no-useless-escape
        sanitizedString = sanitizedString.replace(/\:/, "[:]");
    }

    sanitizedString = sanitizedString.replace(/\./g, "[.]");
    return sanitizedString;
};

export const unSanitizeURL = (sanitizedString: string) => {
    let actualString = sanitizedString.replace(/\[:]/, ":");
    if (doesURIContainsProtocol(actualString)) {
        actualString = actualString.replace(/xx/, "tt");
    }

    actualString = actualString.replace(/\[.]/g, ".");
    return actualString;
};

export const isMOXFIVEUser = ({
    req,
    throwError = false,
}: {
  req: any;
  throwError?: boolean;
}) => {
    if (req.currentUser?.organizationId !== process.env.MOXFIVE_ID) {
        if (throwError) {
            throw new InsufficientPrivilagesError();
        }
        return false;
    }
    return true;
};

export function convertToObjectId(id: string) {
    return new mongoose.Types.ObjectId(id);
}

export const intersectArrays = (a: string[], b: string[]) => {
    const setB = new Set(b);
    return [...new Set(a)].filter(x => setB.has(x));
};

export const sanitizeURI = (URIString: string) => {
    let sanitizedString = URIString;
    if (doesURIContainsProtocol(sanitizedString)) {
        sanitizedString = sanitizedString.replace(/tt/, "xx");
        // eslint-disable-next-line
        sanitizedString = sanitizedString.replace(/\:/, "[:]");
    }

    sanitizedString = sanitizedString.replace(/\./g, "[.]");
    return sanitizedString;
};

export const sanitizeIP = (ipAddress: string) => {
    // eslint-disable-next-line
    return ipAddress.replace(/\.(?=[^\.]+$)/, "[.]");
};

export const sanitizeEmail = (email: string) => {
    return email.replace(/\./g, "[.]");
};
