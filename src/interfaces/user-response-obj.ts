import { ResponseWitnessDoc } from "../models/response-witness";

export interface userResponseObj {
    userId: string,
    projectId: string,
    completed: boolean,
    witnesses: string[] | ResponseWitnessDoc[]
}
