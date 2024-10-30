import "dotenv/config";
import { Octokit } from "octokit";

export function getAuthenticatedInstance() {
    const octokit = new Octokit({
        auth: process.env["GITHUB_TOKEN"],
    });

    return octokit;
}
