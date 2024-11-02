import express from "express";

import {
    fetchRepositoriesCommitedToInfo,
    fetchRepositoriesContributedToInfo,
} from "../service/RepositoryService.js";
import { SSEStream } from "../utils/SSEStream.js";

export { router as UserRepositoryRouter };

const router = express.Router({ mergeParams: true });

router.get("/contributed-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const stream = new SSEStream(res);

    const it = fetchRepositoriesContributedToInfo(
        octokit,
        login,
        new Date(fromDate),
        new Date(toDate)
    );

    const promises = [];
    for await (const repository of it) {
        promises.push(stream.streamResponse(repository));
    }
    await Promise.all(promises);

    res.end();
});

router.get("/repositories/commited-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const stream = new SSEStream(res);

    const it = fetchRepositoriesCommitedToInfo(
        octokit,
        login,
        new Date(fromDate),
        new Date(toDate)
    );

    const promises = [];
    for await (const repository of it) {
        promises.push(stream.streamResponse(repository));
    }
    await Promise.all(promises);

    res.end();
});
