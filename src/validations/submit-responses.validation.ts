import { body, ValidationChain } from "express-validator";
import { arrayValidator, booleanValidator, mongoIDValidator, numberValidator, stringValidator } from "../utils/express-validator-wrapper";

export const submitResponsesValidation = () => {
    const validations: ValidationChain[] = [
        ...mongoIDValidator([
            {
                name: "projectId",
                param: true,
                message: "Project Id must be valid."
            }
        ]),
        body("projectType")
            .exists().bail()
            .custom((value: string) => {
                if (!(["Incident", "Resilience"].includes(value))) {
                    throw new Error("Project type can be any from this list only: Incident, Resilience.");
                }
                else {
                    return true;
                }
            })
    ];

    arrayValidator([
        {
            name: "responses",
            mandatory: true,
            minLength: 1,
            message: "Responses must be an array with minimum 1 element."
        }
    ], validations);

    booleanValidator([
        {
            name: "responses.*.skipped",
            mandatory: true,
            message: "Skipped must be boolean."
        }
    ], validations);

    arrayValidator([
        {
            name: "responses.*.questions",
            ifConditions: [body("responses.*.skipped").equals("false")],
            mandatory: true,
            minLength: 1,
            message: "Questions must be an array with minimum 1 element."
        }
    ], validations);

    mongoIDValidator([
        {
            name: "responses.*.organizationId",
            mandatory: true,
            message: "Type must be valid."
        },
        {
            name: "responses.*.questions.*.id",
            ifConditions: [body("responses.*.skipped").equals("false")],
            mandatory: true,
            message: "Question Id must be valid."
        },
    ], validations);

    validations.push(
        body("responses.*.questions.*.type")
            .if(body("responses.*.skipped").equals("false"))
            .exists().bail()
            .custom((value: string) => {
                if (!(["Number", "Text"].includes(value))) {
                    throw new Error("Question type can be any from this list only: Number, Text.");
                }
                else {
                    return true;
                }
            })
    );

    numberValidator([
        {
            name: "responses.*.questions.*.answer",
            ifConditions: [body("responses.*.skipped").equals("false"), body("responses.*.questions.*.type").equals("Number")],
            mandatory: true,
            min: 0,
            max: 10,
            message: "Answer must be positive number between 0 and 10."
        }
    ], validations);

    stringValidator([
        {
            name: "responses.*.questions.*.answer",
            ifConditions: [body("responses.*.skipped").equals("false"), body("responses.*.questions.*.type").equals("Text")],
            maxLength: 2000,
            nullable: true,
            message: "Answer must be string and of max 2000 characters long."
        }
    ], validations);

    return validations;
};
