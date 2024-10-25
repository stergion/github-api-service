import { Request, Response, NextFunction } from "express";
import { Octokit } from "octokit";

declare global {
    namespace Express {
        interface Request {
            octokit: Octokit;
        }
    }
}

/**
 * Injects validated Octokit object to exrpess request
 */
export function injectOctokit() {
    return async (req: Request, res: Response, next: NextFunction) => {

        const octokit = new Octokit({
            auth: process.env["GITHUB_TOKEN"]
        });

        req.octokit = octokit;

        next();
    };
}
