import { mongoIDValidator, stringValidator } from "../utils/express-validator-wrapper";
import { ProjectTypesEnum } from "../enums/project-types.enum";

export const GetNpsStatusFormsValidation =  [
    ...mongoIDValidator([
        {
            name: "projectId",
            param: true,
            mandatory: true,
            message: "Project ID must be valid."
        }
    ]),
    ...stringValidator([
        {
            name: "projectType",
            query: true,
            mandatory: true,
            customValidators: [(value: string) => {
                const projectTypes = Object.values((ProjectTypesEnum));
                return projectTypes.includes(value as ProjectTypesEnum);
            }],
            message: `Project Type must be any of the ${Object.values(ProjectTypesEnum)}.`
        }
    ])
];
