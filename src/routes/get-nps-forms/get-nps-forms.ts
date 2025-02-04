import express, { NextFunction, Request, Response } from "express";
import {
    currentUser, hasGlobalAction, InsufficientPrivilagesError,
    InternalServerError,
    NotFoundCode,
    requireAuth,
    ResourceNotFoundError,
    responseHandler,
    validateRequest
} from "@moxfive-llc/common";
import { Organization } from "../../models/organization";
import { RespondentQuestionsMap, witnesses } from "../../models/respondent-questions-map";
import { Question, QuestionDoc } from "../../models/question";
import { ProjectTypesEnum } from "../../enums/project-types.enum";
import { Incident } from "../../models/incident";
import { User } from "../../models/user";
import { QuestionPlaceholder } from "../../models/question-placeholder";
import { getUsersByIds } from "../../utils/get-users-by-ids";
import { LeanDocument } from "mongoose";
import { QuestionPlaceholdersEnum } from "../../enums/question-placeholders.enum";
import { Responses } from "../../models/response";
import { responses, ResponseWitness } from "../../models/response-witness";
import { GetNpsStatusFormsValidation } from "../../validations/get-nps-status-forms.validation";

const router = express.Router();

router.get("/v1/nps/projects/:projectId",
    responseHandler,
    currentUser,
    requireAuth,
    GetNpsStatusFormsValidation,
    validateRequest,
    // eslint-disable-next-line max-statements
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const hasPermission = await hasGlobalAction(req, "GetNPSFormsData");
            if (!hasPermission) {
                throw new InsufficientPrivilagesError();
            }

            // Step 1: Fetch project type
            const { projectType } = req.query;
            const { projectId } = req.params;

            // Step 2: Fetch logged-in user's organizationId
            const loggedInUserId = req.currentUser?.organizationId;
            if(!loggedInUserId) {
                throw new InternalServerError();
            }

            // Step 3: Fetch Organization type of user's organization
            const organization = await Organization.findById(loggedInUserId).select("organizationTypeIds").lean().exec();
            if(!organization) {
                throw new ResourceNotFoundError(NotFoundCode.ORGANIZATION_NOT_FOUND, "Organization not found.");
            }

            const userOrganizationTypes = new Set(organization.organizationTypeIds.map(String));

            // Step 4:  Fetch members of the project
            let members: string[] = [];

            if(projectType === ProjectTypesEnum.INCIDENT) {
                // Fetch Incident
                const incident = await Incident.findById(projectId).select("members").lean().exec();
                if(!incident) {
                    throw new ResourceNotFoundError(NotFoundCode.INCIDENT_NOT_FOUND, "Incident not found.");
                }
                // If  there are no members in the project or user is not part of project, then return blank array
                if(!incident.members.length || !incident.members.map(String).includes(req.currentUser?.id as string)) {
                    return res.sendResponse([], {});
                }
                members = incident.members.map(String);
            }
            else {
                throw new InternalServerError();
            }

            // Step 5: Fetch respondent questions
            const respondentsQuestions = await RespondentQuestionsMap.find({ respondentType: { $in: organization.organizationTypeIds } }).lean().exec();

            if(!respondentsQuestions.length) {
                return res.sendResponse([], {});
            }

            // Step 6: Filter out unique witnesses
            let uniqueWitnesses: witnesses[] = [];
            // If respondentsQuestions length is 1 then add all witnesses directly
            if(respondentsQuestions.length === 1) {
                respondentsQuestions[0].witnesses.forEach(witness => {
                    if(witness.projectTypes.includes(projectType)) {
                        uniqueWitnesses.push(witness);
                    }
                });
            }
            else {
                // Case: Here is user part of org which has multiple org types
                const witnesses: any = [];
                const uniqueWitnessesIds: Set<string> = new Set();

                // Remove witnesses which are same org as user belongs to
                respondentsQuestions.forEach(respondent => {
                    respondent.witnesses.forEach(witness => {
                        if(!userOrganizationTypes.has(String(witness.type)) && witness.projectTypes.includes(projectType)) {
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
                    if(!uniqueWitnessesIds.has(String(record.witness.type))) {
                        uniqueWitnessesIds.add(String(record.witness.type));
                        uniqueWitnesses.push(record.witness);
                    }
                });
            }

            // Step 7: Fetch users info and make organization users map
            const organizationUsersMap: Map<string, string[]> = new Map();

            const projectUsers = await User.find({ _id: { $in: members } }).select("organizationId").lean().exec();
            projectUsers.forEach(user => {
                const orgUsers = organizationUsersMap.get(String(user.organizationId));
                if(!orgUsers) {
                    organizationUsersMap.set(String(user.organizationId), [String(user._id)]);
                }
                else {
                    organizationUsersMap.set(String(user.organizationId), [...orgUsers, String(user._id)]);
                }
            });

            // Step 8: Fetch organizations info and make org type organizations map
            const orgTypeOrganizationsMap: Map<string, string[]> = new Map();
            const orgNameMap: Map<string, string> = new Map();

            const organizations = await Organization.find({ _id: { $in: [...organizationUsersMap.keys()] } }).select("organizationTypeIds name").lean().exec();
            organizations.forEach(org => {
                // Save organization type ids
                org.organizationTypeIds.forEach(type => {
                    const orgs = orgTypeOrganizationsMap.get(String(type));
                    if(!orgs) {
                        orgTypeOrganizationsMap.set(String(type), [String(org._id)]);
                    }
                    else {
                        orgTypeOrganizationsMap.set(String(type), [...orgs, String(org._id)]);
                    }
                });

                // Save name in map
                orgNameMap.set(String(org._id), org.name);
            });

            // Step 9: Remove witnesses of none of the project members are part of that organization type
            const projectMembersOrgTypes = new Set([...orgTypeOrganizationsMap.keys()]);

            uniqueWitnesses = uniqueWitnesses.reduce((witnesses: witnesses[], witness: witnesses) => {
                if(projectMembersOrgTypes.has(String(witness.type))) {
                    witnesses.push(witness);
                }
                return witnesses;
            }, []);

            if(!uniqueWitnesses.length) {
                return res.sendResponse([], {});
            }

            // Step 10: Fetch questionIds and make question maps
            let questionIds: string[] = [];
            uniqueWitnesses.forEach(witness => {
                questionIds = questionIds.concat(witness.questions);
            });

            const questions = await Question.find({ _id: { $in: questionIds } }).lean().exec();
            const questionMaps: Map<string, LeanDocument<QuestionDoc>> = new Map();
            questions.forEach(question => {
                questionMaps.set(question._id.toString(), question);
            });

            // Step 11: Fetch placeholders
            const placeholders = await QuestionPlaceholder.find({}).lean().exec();
            const placeHoldersMap: Map<string, string> = new Map();
            placeholders.forEach(placeholder => {
                placeHoldersMap.set(placeholder._id.toString(), placeholder.name);
            });

            // Step 12: Make id name map of project members
            const usersMap = await getUsersByIds(members);

            // Step 13: Fetch the response of the user
            const responseWitnessesMap: Map<string, {response: responses[] | null, skipped: boolean }> = new Map();

            const response = await Responses.findOne({ userId: req.currentUser?.id, projectId }).lean().exec();
            if(response) {
                const responseWitnesses = await ResponseWitness.find({ _id: { $in: response.witnesses } });
                responseWitnesses.forEach(witness => {
                    responseWitnessesMap.set(String(witness.organizationId), {
                        response: witness.responses,
                        skipped: witness.skipped
                    });
                });
            }

            // Step 14: Prepare type priorities map of all unique respondents map
            const uniqueRespondentType = uniqueWitnesses.map(witness => witness.type);

            const typePriorityMap: Map<string, number> = new Map();
            const typePriorities = await RespondentQuestionsMap.find({ respondentType: { $in: uniqueRespondentType } }).select("respondentType priority").lean().exec();
            typePriorities.forEach(type => {
                typePriorityMap.set(String(type.respondentType), type.priority);
            });

            // Step 15: From all unique witnesses sort the witnesses as per the priority
            uniqueWitnesses = uniqueWitnesses.map(witness => {
                return {
                    ...witness,
                    priority: typePriorityMap.get(String(witness.type)) ??  Number.MAX_VALUE
                };
            }).sort((a, b) => a.priority - b.priority);

            // Step 16: Make formatted response
            const addedOrganizationsSet: Set<string> = new Set();

            // Map through all unique witnesses
            const npsForms = uniqueWitnesses.reduce((forms: any, witness: witnesses) => {

                // Fetch organizations that belongs to this organization type
                const organizationOfOrgType = orgTypeOrganizationsMap.get(String(witness.type));

                // If any organization are present of that organization then loop through their organizations
                if(organizationOfOrgType && organizationOfOrgType.length) {
                    organizationOfOrgType.forEach(org => {
                        // If that organization is not already processed then continue
                        if(!addedOrganizationsSet.has(org)) {
                            addedOrganizationsSet.add(org);

                            // Get Org name
                            const orgName = orgNameMap.get(String(org));

                            // Check user has filled the response or not and if filled make question answers map
                            const witnessResponse = responseWitnessesMap.get(String(org));
                            const questionAnswerMap: Map<string, string | number | null> = new Map();

                            if(witnessResponse) {
                                // If witness response is skipped then don't add that response
                                if(witnessResponse.skipped) {
                                    return forms;
                                }
                                if(witnessResponse.response) {
                                    witnessResponse.response.forEach(questionAnswer => {
                                        questionAnswerMap.set(questionAnswer.id.toString(), questionAnswer.value);
                                    });
                                }
                            }

                            // Map through all questions
                            const questions = witness.questions.map(question => {
                                // Fetch question
                                let questionInfo = questionMaps.get(String(question));

                                if(questionInfo) {
                                    // Doing this as we need different reference every time
                                    questionInfo = { ...questionInfo };

                                    // if question has any placeholders
                                    if(questionInfo.placeholders.length) {
                                        // Loop through all placeholders
                                        questionInfo.placeholders.forEach(placeholder => {
                                            const placeholderName = placeHoldersMap.get(String(placeholder));

                                            if(placeholderName) {
                                                // If placeholder is of organization
                                                if(placeholderName === QuestionPlaceholdersEnum.ORGANIZATION) {
                                                    // Replace organization placeholder id with organization name
                                                    if(questionInfo) {
                                                        questionInfo.title = questionInfo.title.replace(`<<${String(placeholder)}>>`, orgName || "");
                                                    }
                                                }
                                                // If placeholder is of members
                                                else if(placeholderName === QuestionPlaceholdersEnum.MEMBERS) {
                                                    // Replace the members placeholder id with members name
                                                    let membersString = `<strong>(`;

                                                    // Fetch users of the organization
                                                    const users = organizationUsersMap.get(String(org));
                                                    if(users) {
                                                        // Loop through all users
                                                        users.forEach(user => {
                                                            // Fetch name of the user
                                                            const name = usersMap.get(user);
                                                            if(name) {
                                                                membersString += `${name}, `;
                                                            }
                                                        });
                                                    }

                                                    // Remove last command and space
                                                    membersString = membersString.slice(0, -2);

                                                    membersString +=   `)</strong>`;
                                                    if(questionInfo) {
                                                        questionInfo.title = questionInfo.title.replace(`<<${String(placeholder)}>>`, membersString);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }

                                return {
                                    id: questionInfo?._id ?? "",
                                    title: questionInfo?.title ? `<p>${questionInfo.title}${!questionInfo.required ? " (Optional)" : ""}</p>` : "",
                                    type: questionInfo?.type ?? "",
                                    required: questionInfo?.required ?? false,
                                    answer: (questionAnswerMap.get(String(questionInfo?._id))) ?? null
                                };
                            });

                            forms.push({
                                organization: {
                                    id: org,
                                    name: orgName || ""
                                },
                                completed: Boolean(witnessResponse),
                                questions
                            });
                        }
                    });
                }

                return forms;
            }, []);

            // Step 17: Send response
            res.sendResponse(npsForms, {});
        }
        catch (error) {
            console.error("NPS.GetNPSForms");
            console.error(error);
            next(error);
        }
    });

export { router as getNPSFormsRouter };
