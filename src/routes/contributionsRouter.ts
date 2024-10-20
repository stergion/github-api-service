import express from "express";
import { print } from "graphql";

import { ResultOf, VariablesOf } from "@graphql-typed-document-node/core";
import {
    IssueCommentsDocument,
    IssuesDocument,
    PullRequestReviewsDocument,
    PullRequestsDocument,
} from "../graphql/typed_queries.js";
import { DateWindows } from "../utils/DateWindows.js";
import { getQueryNodes } from "./helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "./helpers/sendQueries.js";
import { streamResponse } from "./helpers/sendStreamChunk.js";

export { router as contributionsRouter };

const router = express.Router({ mergeParams: true });

router.get("/commits/:githubId/:owner/:name/:fromDate/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate, githubId, owner, name } = req.params as typeof req.params & {
        login: string;
    };

    res.status(501).end(JSON.stringify({ message: "Not Implemented" }));
});

router.get("/issues/from-date/:fromDate/to-date/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const issuesQueryVariables: VariablesOf<typeof IssuesDocument> = {
        login: login,
        // cursor: null,
    };

    let result: any = dateWindows
        .map(sendQueryWindowedPaginated(octokit, IssuesDocument, issuesQueryVariables))
        .flatMap(getQueryNodes)
        .map(streamResponse(res))
        .flat();
    result = await Promise.all(result);

    res.end();
});

router.get("/pullrequests/from-date/:fromDate/to-date/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const pullRequestsVariables: VariablesOf<typeof PullRequestsDocument> = {
        login: login,
        fromDate: null,
        toDate: null,
        cursor: null,
    };

    const result = dateWindows
        .map(sendQueryWindowedPaginated(octokit, PullRequestsDocument, pullRequestsVariables))
        .flatMap(getQueryNodes)
        .map(streamResponse(res))
    await Promise.all(result);

    res.end();
});

router.get("/pullrequest-reviews/from-date/:fromDate/to-date/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const pullrequestReviewsVariables: VariablesOf<typeof PullRequestReviewsDocument> = {
        login: login,
        fromDate: null,
        toDate: null,
        cursor: null,
    };

    const result = dateWindows
        .map(
            sendQueryWindowedPaginated(
                octokit,
                PullRequestReviewsDocument,
                pullrequestReviewsVariables
            )
        )
        .flatMap(getQueryNodes)
        .map(streamResponse(res))
    await Promise.all(result);

    res.end();
});

router.get("/issue-comments/from-date/:fromDate/to-date/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const queryVariables: VariablesOf<typeof IssueCommentsDocument> = {
        login: login,
        cursor: null,
    };
    const it = octokit.graphql.paginate.iterator<ResultOf<typeof IssueCommentsDocument>>(
        print(IssueCommentsDocument),
        queryVariables
    );
});

router.get("/commit-comments/from-date/:fromDate/to-date/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };

    res.status(501).end(JSON.stringify({ message: "Not Implemented" }));
});
