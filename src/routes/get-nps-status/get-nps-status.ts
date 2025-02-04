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
import { ProjectTypesEnum } from "../../enums/project-types.enum";
import { Incident } from "../../models/incident";
import { User } from "../../models/user";
import { GetNpsStatusFormsValidation } from "../../validations/get-nps-status-forms.validation";
import { Responses } from "../../models/response";

const router = express.Router();

router.get("/v1/nps/projects/:projectId/status",
    responseHandler,
    currentUser,
    requireAuth,
    GetNpsStatusFormsValidation,
    validateRequest,
    // eslint-disable-next-line max-statements
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const hasPermission = await hasGlobalAction(req, "GetNPSStatus");
            if (!hasPermission) {
                throw new InsufficientPrivilagesError();
            }

            const resp = { status: false };

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
                const incident = await Incident.findById(projectId).select("members progressPercentage").lean().exec();
                if(!incident) {
                    throw new ResourceNotFoundError(NotFoundCode.INCIDENT_NOT_FOUND, "Incident not found.");
                }
                // If incident progress percentage is lesser than 85 or there are no members in the project, then send status false
                if(incident.progressPercentage < 85 || !incident.members.length || !incident.members.map(String).includes(req.currentUser?.id as string)) {
                    return res.sendResponse(resp, {});
                }
                members = incident.members.map(String);
            }
            else {
                throw new InternalServerError();
            }

            // Step 5: Fetch respondent questions
            const respondentsQuestions = await RespondentQuestionsMap.find({ respondentType: { $in: organization.organizationTypeIds } });
            if(!respondentsQuestions.length) {
                return res.sendResponse(resp, {});
            }

            // Step 6: Filter out unique witnesses
            let uniqueWitnesses: witnesses[] = [];
            const uniqueWitnessesIds: Set<string> = new Set();

            respondentsQuestions.forEach(respondent => {
                respondent.witnesses.forEach(witness => {
                    if(!userOrganizationTypes.has(String(witness.type)) && witness.projectTypes.includes(projectType) && !uniqueWitnessesIds.has(String(witness.type))) {
                        uniqueWitnesses.push(witness);
                        uniqueWitnessesIds.add(String(witness.type));
                    }
                });
            });

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

            const organizations = await Organization.find({ _id: { $in: [...organizationUsersMap.keys()] } }).select("organizationTypeIds").lean().exec();
            organizations.forEach(org => {
                org.organizationTypeIds.forEach(type => {
                    const orgUsers = orgTypeOrganizationsMap.get(String(type));
                    if(!orgUsers) {
                        orgTypeOrganizationsMap.set(String(type), [String(org._id)]);
                    }
                    else {
                        orgTypeOrganizationsMap.set(String(type), [...orgUsers, String(org._id)]);
                    }
                });
            });

            // Step 9: Remove witnesses of none of the project members are part of that organization type
            const projectMembersOrgTypes = new Set([...orgTypeOrganizationsMap.keys()]);

            uniqueWitnesses = uniqueWitnesses.reduce((witnesses: witnesses[], witness: witnesses) => {
                if(projectMembersOrgTypes.has(String(witness.type))) {
                    witnesses.push(witness);
                }
                return witnesses;
            }, []);

            // Step 10: After filtering out unique witnesses if any unique witness is present then fetch response
            if(uniqueWitnesses.length) {
                const uniqueOrganizationIdsSet: Set<string> = new Set();

                // Loop through all witnesses
                uniqueWitnesses.forEach(witness => {
                    // Fetch organizations that belongs to this organization type
                    const organizationOfOrgType = orgTypeOrganizationsMap.get(String(witness.type));

                    // If any organizations found
                    if (organizationOfOrgType && organizationOfOrgType.length) {
                        // Make uniqueOrganizationIdsSet
                        organizationOfOrgType.forEach(org => {
                            if (!uniqueOrganizationIdsSet.has(org)) {
                                uniqueOrganizationIdsSet.add(org);
                            }
                        });
                    }
                });

                if(uniqueOrganizationIdsSet.size) {
                    // If response found & it is not completed then set status on true
                    const response = await Responses.findOne({ userId: req.currentUser?.id, projectId }).lean().exec();
                    if(response) {
                        // eslint-disable-next-line max-depth
                        if(!response.completed) {
                            resp.status = true;
                        }
                    }
                    else {
                        resp.status = true;
                    }
                }
            }

            // Step 11: Send response
            res.sendResponse(resp, {});
        }
        catch (error) {
            console.error("NPS.GetNPSStatus");
            console.error(error);
            next(error);
        }
    });

export { router as getNPSStatusRouter };
