import { param, validationResult } from "express-validator";
import express from "express";
import { RequestParamsValidationError } from "../utils/errors/ValidationError.js";

function GitHubNameParamValidator(name: string, alias: string) {
    return param(name)
        .trim()
        .escape()
        .notEmpty()
        .withMessage(`GitHub ${alias} is required`)
        .isString()
        .withMessage(`GitHub ${alias} must be a string`)
        .isLength({ min: 1, max: 25 })
        .withMessage(`GitHub ${alias} is too long`)
        .matches(/^[a-zA-Z0-9-]+$/)
        .withMessage(`GitHub ${alias} can only contain alphanumeric characters and hyphens`);
}
export function loginParamValidator() {
    return GitHubNameParamValidator("login", "username");
}

export function githubOwnerParamValidator() {
    return GitHubNameParamValidator("owner", "repository owner");
}

export function githubNameParamValidator() {
    return GitHubNameParamValidator("name", "repository name");
}

export function dateParamValidator(on: "fromDate" | "toDate") {
    return param(on)
        .trim()
        .escape()
        .notEmpty()
        .withMessage(`${on} is required`)
        .isString()
        .isISO8601()
        .withMessage(`${on} must be a valid ISO8601 date`);
}

export function run() {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
            return next();
        }
        throw new RequestParamsValidationError(result.array());
    };
}
