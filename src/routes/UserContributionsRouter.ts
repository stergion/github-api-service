import express from "express";

import { VariablesOf } from "@graphql-typed-document-node/core";
import {
    IssuesDocument,
    PullRequestReviewsDocument,
    PullRequestsDocument,
} from "../graphql/typed_queries.js";
import {
    fetchCommitComments,
    fetchIssueComments,
    fetchRepositoryCommits,
} from "../service/ContributionsService.js";
import { fetchUserInfo } from "../service/UserService.js";
import { DateWindows } from "../utils/DateWindows.js";
import { SSEStream } from "../utils/SSEStream.js";
import { getQueryNodes } from "./helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "./helpers/sendQueries.js";

export { router as UserContributionsRouter };

const router = express.Router({ mergeParams: true });

// Get commits from repository
router.get("/commits/:owner/:name/:fromDate/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, owner, name } = req.params as typeof req.params & {
        login: string;
    };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const stream = new SSEStream(res);

    const userInfo = await fetchUserInfo(octokit, login);

    const commits = await fetchRepositoryCommits(
        octokit,
        userInfo.id,
        owner,
        name,
        fromDate,
        toDate
    );

    await Promise.all(commits.map(stream.streamResponse.bind(stream)));

    res.end();
});

router.get("/issues/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const stream = new SSEStream(res);

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const issuesQueryVariables: VariablesOf<typeof IssuesDocument> = {
        login: login,
        // cursor: null,
    };

    let result = dateWindows
        .map(sendQueryWindowedPaginated(octokit, IssuesDocument, issuesQueryVariables))
        .map(getQueryNodes)
        .map(stream.streamResponse.bind(stream));
    await Promise.all(result);

    res.end();
});

router.get("/pullrequests/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const stream = new SSEStream(res);

    const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

    const pullRequestsVariables: VariablesOf<typeof PullRequestsDocument> = {
        login: login,
        fromDate: null,
        toDate: null,
        cursor: null,
    };

    const result = dateWindows
        .map(sendQueryWindowedPaginated(octokit, PullRequestsDocument, pullRequestsVariables))
        .map(getQueryNodes)
        .map(stream.streamResponse.bind(stream));
    await Promise.all(result);

    res.end();
});

router.get("/pullrequest-reviews/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, fromDate, toDate } = req.params as typeof req.params & {
        login: string;
    };

    const stream = new SSEStream(res);

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
        .map(getQueryNodes)
        .map(stream.streamResponse.bind(stream));
    await Promise.all(result);

    res.end();
});

router.get("/issue-comments/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };

    const stream = new SSEStream(res);

    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const promises = [];
    const it = fetchIssueComments(octokit, login, fromDate, toDate);
    for await (const comments of it) {
        promises.push(stream.streamResponse(comments));
    }
    await Promise.all(promises);

    res.end();
});

router.get("/commit-comments/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };

    const stream = new SSEStream(res);

    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const it = fetchCommitComments(octokit, login, fromDate, toDate);

    const promises = [];
    for await (const comments of it) {
        promises.push(stream.streamResponse(comments));
    }
    await Promise.all(promises);

    res.end();
});
