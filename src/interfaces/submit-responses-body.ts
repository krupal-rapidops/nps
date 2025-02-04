import { ProjectTypesEnum } from "../enums/project-types.enum";

export interface SubmitResponsesBody {
    projectType: ProjectTypesEnum,
    responses: [{
        organizationId: string,
        skipped: boolean,
        questions: [{
            id: string,
            type: "Number" | "Text",
            answer: number | string
        }] | null
    }]
}
