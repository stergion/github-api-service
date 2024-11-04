import { param, validationResult } from "express-validator";
import express from "express";

export function loginParamValidtor() {
    return param("login")
        .trim()
        .escape()
        .notEmpty()
        .withMessage("GitHub username is required")
        .isString()
        .withMessage("GitHub username must be a string")
        .isLength({ min: 1, max: 25 })
        .withMessage("GitHub username is too long")
        .matches(/^[a-zA-Z0-9-]+$/)
        .withMessage("GitHub username can only contain alphanumeric characters and hyphens");
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
        res.status(400).json({ errors: result.array() }).end();
    };
}
