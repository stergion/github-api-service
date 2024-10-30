import "dotenv/config";
import { Octokit } from "octokit";

import { onRateLimit, onSecondaryRateLimit } from "./plugins.js";

export function getAuthenticatedInstance() {
    const octokit = new Octokit({
        auth: process.env["GITHUB_TOKEN"],
        throttle: {
            onRateLimit,
            onSecondaryRateLimit,
        },
        request: {
            retries: 10,
            retryAfter: 1
          },
    });

    return octokit;
}
