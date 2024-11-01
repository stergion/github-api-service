import express from "express";

import {
    fetchRepositoriesCommitedToInfo,
    fetchRepositoriesContributedToInfo,
} from "../service/RepositoryService.js";
import { streamResponse } from "./helpers/sendStreamChunk.js";

export { router as UserRepositoryRouter };

const router = express.Router({ mergeParams: true });

router.get("/contributed-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const it = fetchRepositoriesContributedToInfo(
        octokit,
        login,
        new Date(fromDate),
        new Date(toDate)
    );

    const stream = streamResponse(res);
    for await (const repository of it) {
        stream(repository);
    }

    res.end();
});

router.get("/repositories/commited-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const it = fetchRepositoriesCommitedToInfo(
        octokit,
        login,
        new Date(fromDate),
        new Date(toDate)
    );

    const stream = streamResponse(res);
    for await (const repository of it) {
        stream(repository);
    }

    res.end();
});
