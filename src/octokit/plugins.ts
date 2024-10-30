import { Octokit } from "octokit";

export function onRateLimit(retryAfter: number, options: any, octokit: Octokit) {
    octokit.log.warn(
        `Throttle: Request quota exhausted for request ${options.method} ${options.url}`
    );

    if (options.request.retryCount < 20) {
        // retries 20 times
        octokit.log.info(
            `Retrying after ${retryAfter} seconds! (retryCount: ${options.request.retryCount})`
        );
        return true;
    }
}

export function onSecondaryRateLimit(retryAfter: number, options: any, octokit: Octokit) {
    octokit.log.warn(
        `Throttle: SecondaryRateLimit detected for request ${options.method} ${options.url}`
    );

    octokit.log.info(
        `Retrying after ${retryAfter} seconds! (retryCount: ${options.request.retryCount})`
    );
    return true;
}
