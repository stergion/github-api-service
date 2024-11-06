import { Request, Response, NextFunction } from "express";
import { Octokit } from "octokit";
import { getAuthenticatedInstance } from "../octokit/octokit.js";

declare global {
    namespace Express {
        interface Request {
            octokit: Octokit;
        }
    }
}

/**
 * Injects validated Octokit object to express request
 */
export function injectOctokit() {
    return async (req: Request, res: Response, next: NextFunction) => {
        req.octokit = getAuthenticatedInstance();

        next();
    };
}
