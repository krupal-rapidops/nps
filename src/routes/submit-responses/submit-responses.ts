/* eslint-disable max-statements */
import {
    BasicResourceValueUnacceptableConflictError,
    ConflictErrorCodes,
    currentUser,
    hasGlobalAction,
    InsufficientPrivilagesError,
    NotFoundCode,
    requireAuth,
    ResourceNotFoundError,
    validateRequest
} from "@moxfive-llc/common";
import express, { Request, Response, NextFunction } from "express";
import { ProjectTypesEnum } from "../../enums/project-types.enum";
import { SubmitResponsesBody, userResponseObj } from "../../interfaces";
import { Incident } from "../../models/incident";
import { Organization } from "../../models/organization";
import { Question } from "../../models/question";
import { RespondentQuestionsMap, witnesses } from "../../models/respondent-questions-map";
import { Responses } from "../../models/response";
import { ResponseWitness, ResponseWitnessDoc } from "../../models/response-witness";
import { Tracker } from "../../models/tracker";
import { User } from "../../models/user";
import { intersectArrays } from "../../utils";
import { submitResponsesValidation } from "../../validations/submit-responses.validation";

const router = express.Router();

router.post(
    "/v1/nps/projects/:projectId",
    currentUser,
    requireAuth,
    submitResponsesValidation(),
    validateRequest,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const hasPermission = await hasGlobalAction(req, "SubmitNPSResponses");
            if (!hasPermission) {
                throw new InsufficientPrivilagesError();
            }

            const userId = req.currentUser?.id || null;
            const organizationId = req.currentUser?.organizationId || null;
            const { projectId } = req.params;
            const { projectType, responses }: SubmitResponsesBody = req.body;
            let members: string[] = [];

            // Validate the project type and its trigger point for a user
            if (projectType === ProjectTypesEnum.INCIDENT) {
                const incident = await Incident.findById(projectId).select("members progressPercentage").lean().exec();
                if (!incident) {
                    throw new ResourceNotFoundError(NotFoundCode.INCIDENT_NOT_FOUND, "Incident not found.");
                }
                if (incident.progressPercentage < 85 || !incident.members.length || !incident.members.map(String).includes(req.currentUser?.id as string)) {
                    throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_CANNOT_ACCEPTED, "Your feedback cannot be accepted at this time.");
                }
                members = incident.members.map(String);
            }
            else {
                const resilience = await Tracker.findById(projectId, { members: 1 }).lean().exec();
                if (!resilience) {
                    throw new ResourceNotFoundError(NotFoundCode.TRACKER_NOT_FOUND, "Resilience not found.");
                }
                if (!resilience.members.length) {
                    throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_CANNOT_ACCEPTED, "Your feedback cannot be accepted at this time.");
                }
                members = resilience.members.map(String);
            }

            // Check feedback is already given or not
            const userResponse = await Responses.findOne({ userId, projectId })
                .populate("witnesses", "_id type responses");
            if (userResponse?.completed) {
                throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_ALREADY_SUBMITTED, "Feedback cannot be submitted multiple times.");
            }

            // Check request contains all the unique orgIds in response
            const uniqueOrgIds = new Set();
            responses.forEach(response => uniqueOrgIds.add(String(response.organizationId)));
            if (responses.length !== uniqueOrgIds.size) {
                throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_TYPE_INVALID, "Witness type must be present and unique.");
            }

            // Validate the organization and get its organizationTypes
            const organization = await Organization.findById(organizationId).select("organizationTypeIds").lean().exec();
            if (!organization) {
                throw new ResourceNotFoundError(NotFoundCode.ORGANIZATION_NOT_FOUND, "Organization not found.");
            }

            const userOrganizationTypes = new Set(organization.organizationTypeIds.map(String));

            const respondentsQuestions = await RespondentQuestionsMap.find({ respondentType: { $in: organization.organizationTypeIds } }).lean().exec();

            // Filter out unique witnesses
            let uniqueWitnesses: witnesses[] = [];
            // If respondentsQuestions length is 1 then add all witnesses directly
            if (respondentsQuestions.length === 1) {
                respondentsQuestions[0].witnesses.forEach(witness => {
                    if (witness.projectTypes.includes(projectType)) {
                        uniqueWitnesses.push(witness);
                    }
                });
            }
            else {
                // Case: Here is user part of org which has multiple org types
                const witnesses: any = [];
                const uniqueWitnessesIds: Set<string | void> = new Set();

                // Remove witnesses which are same org as user belongs to
                respondentsQuestions.forEach(respondent => {
                    respondent.witnesses.forEach(witness => {
                        if (!userOrganizationTypes.has(String(witness.type)) && witness.projectTypes.includes(projectType)) {
                            witnesses.push({
                                witness,
                                priority: respondent.priority
                            });
                        }
                    });
                });

                // sort by priority in ascending order
                const sortedOnPriority = witnesses.sort((a: any, b: any) => a.priority - b.priority);

                // Get only single witness if there are multiple records of same org type
                sortedOnPriority.forEach((record: any) => {
                    if (!uniqueWitnessesIds.has(String(record.witness.type))) {
                        uniqueWitnessesIds.add(String(record.witness.type));
                        uniqueWitnesses.push(record.witness);
                    }
                });
            }

            // Fetch users info and make organization users map
            const organizationUsersMap: Map<string, string[]> = new Map();

            const projectUsers = await User.find({ _id: { $in: members } }).select("organizationId").lean().exec();
            projectUsers.forEach(user => {
                const orgUsers = organizationUsersMap.get(String(user.organizationId));
                if (!orgUsers) {
                    organizationUsersMap.set(String(user.organizationId), [String(user._id)]);
                }
                else {
                    organizationUsersMap.set(String(user.organizationId), [...orgUsers, String(user._id)]);
                }
            });

            // Fetch organizations info and make org type organizations map
            const orgTypeOrganizationsMap: Map<string, string[]> = new Map();

            const organizations = await Organization.find({ _id: { $in: [...organizationUsersMap.keys()] } }).select("organizationTypeIds").lean().exec();
            organizations.forEach(org => {
                org.organizationTypeIds.forEach(type => {
                    const orgUsers = orgTypeOrganizationsMap.get(String(type));
                    if (!orgUsers) {
                        orgTypeOrganizationsMap.set(String(type), [String(org._id)]);
                    }
                    else {
                        orgTypeOrganizationsMap.set(String(type), [...orgUsers, String(org._id)]);
                    }
                });
            });

            // Remove witnesses of none of the project members are part of that organization type
            const projectMembersOrgTypes = new Set([...orgTypeOrganizationsMap.keys()]);

            uniqueWitnesses = uniqueWitnesses.reduce((witnesses: witnesses[], witness: witnesses) => {
                if (projectMembersOrgTypes.has(String(witness.type))) {
                    witnesses.push(witness);
                }
                return witnesses;
            }, []);

            // Prepare type priorities map of all unique respondents map
            const uniqueRespondentType = uniqueWitnesses.map(witness => witness.type);

            const typePriorityMap: Map<string, number> = new Map();
            const typePriorities = await RespondentQuestionsMap.find({ respondentType: { $in: uniqueRespondentType } }).select("respondentType priority").lean().exec();
            typePriorities.forEach(type => {
                typePriorityMap.set(String(type.respondentType), type.priority);
            });

            // From all unique witnesses sort the witnesses as per the priority
            uniqueWitnesses = uniqueWitnesses.map(witness => {
                return {
                    ...witness,
                    priority: typePriorityMap.get(String(witness.type)) ??  Number.MAX_VALUE
                };
            }).sort((a, b) => a.priority - b.priority);

            // Loop through all the witnesses and make unique organization Ids for which user can provide feedback
            const uniqueOrganizationIdsSet: Set<string> = new Set([]);
            const uniqueWitnessesAsPerOrg: witnesses[] = [];

            // Loop through all witnesses and make unique witnesses as per organization
            uniqueWitnesses.forEach(witness => {
                // Fetch organizations that belongs to this organization type
                const organizationOfOrgType = orgTypeOrganizationsMap.get(String(witness.type));

                // If any organizations found
                if (organizationOfOrgType && organizationOfOrgType.length) {
                    // Make uniqueOrganizationIdsSet
                    organizationOfOrgType.forEach(org => {
                        if (!uniqueOrganizationIdsSet.has(String(org))) {
                            uniqueOrganizationIdsSet.add(String(org));

                            uniqueWitnessesAsPerOrg.push({
                                ...witness,
                                type: org
                            });
                        }
                    });
                }
            });

            uniqueWitnesses = uniqueWitnessesAsPerOrg;

            const parsedUserResponse: userResponseObj | undefined = userResponse ? { ...userResponse?.toJSON() as userResponseObj } : undefined;
            const witnessesToAdd: string[] = [];

            // Get required questions
            const quesIds = new Set();
            const typeToRequiredQuesMap: Map<string, string[]> = new Map();

            uniqueWitnesses.forEach(witness => witness.questions.forEach(que => quesIds.add(String(que))));

            const questions = await Question.find({ _id: { $in: [...quesIds] } }, { required: 1 }).lean().exec();

            uniqueWitnesses.forEach(witness => {
                const witnessQues = witness.questions.map(String);
                const requiredQues = questions.filter(que => witnessQues.includes(String(que._id)) && que.required).map(que => String(que._id));
                typeToRequiredQuesMap.set(String(witness.type), requiredQues);
            });

            // Check given responses and its questions are valid or not
            responses.forEach(response => {
                const witnessDetails = uniqueWitnesses.find(witness => String(witness.type) === String(response.organizationId) && witness.projectTypes.includes(projectType));
                if (!witnessDetails) {
                    throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_TYPE_INVALID, "Witness type must be present and unique.");
                }

                if (!response.skipped && response.questions) {
                    const respQues = response.questions.map(question => String(question.id));

                    const intersectedArrays = intersectArrays(respQues, witnessDetails.questions.map(String));
                    const finalQuesArray = intersectArrays(typeToRequiredQuesMap.get(String(response.organizationId)) || [], intersectedArrays);

                    if ((intersectedArrays.length !== respQues.length
                        || finalQuesArray.length !== (typeToRequiredQuesMap.get(String(response.organizationId)) || []).length)
                        || ([...new Set(respQues)].length !== respQues.length)
                    ) {
                        throw new BasicResourceValueUnacceptableConflictError(ConflictErrorCodes.FEEDBACK_TYPE_INVALID, "All required questions must be valid and unique.");
                    }
                }
            });

            // Store responses in db
            await Promise.all(responses.map(async response => {
                const userWitnesses = parsedUserResponse ? parsedUserResponse.witnesses as ResponseWitnessDoc[] : [];

                const witnessAlreadyExist: ResponseWitnessDoc | undefined = userWitnesses.find(elem => String(elem.organizationId) === String(response.organizationId));

                const witnessData = witnessAlreadyExist ? await ResponseWitness.findById(witnessAlreadyExist.id) : undefined;
                // Check witness document already exist if yes then update the details
                if (parsedUserResponse && witnessAlreadyExist && witnessData) {
                    let isUpdated = false;
                    if (witnessData.skipped !== response.skipped) {
                        isUpdated = true;
                        witnessData.skipped = response.skipped;
                    }
                    if (!response.skipped && response.questions) {
                        const questionArray = response.questions.map(question => ({
                            id: question.id,
                            value: question.answer ?? null
                        }));

                        // Check whether the response array is updated or not
                        if (JSON.stringify(witnessData.responses) !== JSON.stringify(questionArray)) {
                            isUpdated = true;
                            witnessData.responses = questionArray;
                        }
                    }
                    isUpdated && await witnessData.save();
                }
                else {
                    const questions = (!response.skipped && response.questions) ? response.questions.map(question => ({
                        id: question.id,
                        value: question.answer ?? null
                    })) : null;
                    const witness = await ResponseWitness.build({
                        organizationId: response.organizationId,
                        skipped: response.skipped,
                        responses: questions
                    }).save();
                    witnessesToAdd.push(witness.id);
                }
            }));

            // Create or update user's feedback
            const response = await Responses.findOne({ userId, projectId });
            if (response) {
                const witnesses = [...new Set([...response.witnesses.map(String), ...witnessesToAdd])];
                response.witnesses = witnesses;
                response.completed = uniqueWitnesses.length === witnesses.length;

                await response.save();
            }
            else {
                await Responses.build({
                    userId: userId as string,
                    projectId,
                    completed: uniqueWitnesses.length === witnessesToAdd.length,
                    witnesses: witnessesToAdd
                }).save();
            }

            res.json({
                meta: {
                    message: "Feedback has been submitted successfully."
                }
            });
        }
        catch (error) {
            console.error("Incident.SubmitResponses");
            console.info(error);
            next(error);
        }
    }
);

export { router as submitResponsesRouter };
