import { body, ValidationChain, query, param } from "express-validator";
import { MinMaxOptions } from "express-validator/src/options";
import { restrictSpacesAfterPeriod } from ".";
import { ExpressValidatorWrapperFields } from "../interfaces";

// String Validator
export const stringValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else if(field.param) {
            validator = param(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        // Added isString
        validator = validator.isString().trim().blacklist("<>").withMessage(field.message).bail();

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isLength(minMaxOptions);
        }

        validator = validator.withMessage(field.message);

        // Custom validator
        (field.customValidators || []).forEach(customValidator => {
            validator = validator.custom(customValidator).withMessage(field.message).bail();
        });
        validations.push(validator);

    });
    return validations;
};

export const numberValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else if(field.param) {
            validator = param(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        // Added isInt option with min max
        if(field.hasOwnProperty("min") || field.hasOwnProperty("max")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("min")) {
                minMaxOptions.min = field.min;
            }
            if(field.hasOwnProperty("max")) {
                minMaxOptions.max = field.max;
            }

            validator = validator.isInt(minMaxOptions);
        }
        else {
            validator = validator.isInt();
        }
        validator = validator.withMessage(field.message).bail().toInt();

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isLength(minMaxOptions);
        }

        validator = validator.withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const floatValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else if(field.param) {
            validator = param(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.toFloat();

        // Added isInt option with min max
        if(field.hasOwnProperty("min") || field.hasOwnProperty("max")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("min")) {
                minMaxOptions.min = field.min;
            }
            if(field.hasOwnProperty("max")) {
                minMaxOptions.max = field.max;
            }

            validator = validator.isFloat(minMaxOptions);
        }
        else {
            validator = validator.isFloat();
        }
        validator = validator.withMessage(field.message).bail().isFloat();

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isLength(minMaxOptions);
        }

        validator = validator.custom((value) => restrictSpacesAfterPeriod(value));
        validator = validator.withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const emailValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        // Added isString
        validator = validator.isString().trim().blacklist("<>").withMessage(field.message).bail();

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isLength(minMaxOptions);
        }

        validator = validator.isEmail().normalizeEmail().withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const urlValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        // Added isString
        validator = validator.isString().trim().blacklist("<>").withMessage(field.message).bail();

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isLength(minMaxOptions);
        }

        validator = validator.isURL().withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const booleanValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isBoolean({ loose: false }).toBoolean().withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const usNumberValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isMobilePhone("en-US").withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const dateValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isISO8601().withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const usZipValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isPostalCode("US").withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const arrayValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        // Added minLength and maxLength
        if(field.hasOwnProperty("minLength") || field.hasOwnProperty("maxLength")) {
            const minMaxOptions: MinMaxOptions = {};
            if(field.hasOwnProperty("minLength")) {
                minMaxOptions.min = field.minLength;
            }
            if(field.hasOwnProperty("maxLength")) {
                minMaxOptions.max = field.maxLength;
            }
            validator = validator.isArray(minMaxOptions);
        }
        else {
            validator = validator.isArray();
        }
        validator = validator.withMessage(field.message).bail();
        // Custom validator
        (field.customValidators || []).forEach(customValidator => {
            validator = validator.custom(customValidator).withMessage(field.message).bail();
        });

        validator = validator.withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const mongoIDValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        if(field.query) {
            validator = query(field.name);
        }
        else if(field.param) {
            validator = param(field.name);
        }
        else {
            validator = body(field.name);
        }

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isMongoId().withMessage(field.message);
        validations.push(validator);

    });
    return validations;
};

export const ipAddressValidator = (fields : ExpressValidatorWrapperFields[] = [], validations: ValidationChain[] = []) => {

    fields.forEach(field => {
        let validator: ValidationChain;
        validator = body(field.name);

        // If condition
        (field.ifConditions || []).forEach(ifCondition => {
            validator = validator.if(ifCondition);
        });

        // Optional and mandatory validation
        if(field.mandatory) {
            validator = validator.exists().bail();
        }
        else {
            if(field.nullable) {
                validator = validator.optional({ nullable: true });
            }
            else {
                validator = validator.optional();
            }
        }

        validator = validator.isIP().withMessage(field.message);
        validations.push(validator);
    });
    return validations;
};
