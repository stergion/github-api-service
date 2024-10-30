import express from "express";

import {
    RepositoriesCommitedToDocument,
    RepositoriesCommitedToQueryVariables,
    RepositoriesContributedToDocument,
    RepositoriesContributedToQueryVariables,
} from "../graphql/typed_queries.js";
import { DateWindows } from "../utils/DateWindows.js";
import { sendQueryWindowed } from "./helpers/sendQueries.js";
import { streamResponse } from "./helpers/sendStreamChunk.js";

export { router as repositoryRouter };

const router = express.Router({ mergeParams: true });

router.get("/contributed-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const queryVariables: RepositoriesContributedToQueryVariables = {
        login: login,
    };

    const result = dateWindows
        .map(sendQueryWindowed(octokit, RepositoriesContributedToDocument, queryVariables))
        .map(streamResponse(res))
        .map(async (item) => console.log(await item));
    await Promise.all(result);

    res.end();
});

router.get("/commited-to/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const queryVariables: RepositoriesCommitedToQueryVariables = {
        login: login,
    };

    const result = dateWindows
        .map(sendQueryWindowed(octokit, RepositoriesCommitedToDocument, queryVariables))
        .map(streamResponse(res))
        .map(async (item) => console.log(await item));
    await Promise.all(result);

    res.end();
});
