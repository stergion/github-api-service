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
import { getQueryNodes } from "./helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "./helpers/sendQueries.js";
import { streamResponse } from "./helpers/sendStreamChunk.js";

export { router as contributionsRouter };

const router = express.Router({ mergeParams: true });

// Get commits from repository
router.get("/commits/:owner/:name/:fromDate/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login, owner, name } = req.params as typeof req.params & {
        login: string;
    };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const userInfo = await fetchUserInfo(octokit, login);

    const commits = await fetchRepositoryCommits(
        octokit,
        userInfo.user.id,
        owner,
        name,
        fromDate,
        toDate
    );

    await Promise.all(commits.map(streamResponse(res)));

    res.end();
});

router.get("/issues/from/:fromDate/to/:toDate", async (req, res) => {
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
        .map(getQueryNodes)
        .map(streamResponse(res));
    result = await Promise.all(result);

    res.end();
});

router.get("/pullrequests/from/:fromDate/to/:toDate", async (req, res) => {
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
        .map(getQueryNodes)
        .map(streamResponse(res));
    await Promise.all(result);

    res.end();
});

router.get("/pullrequest-reviews/from/:fromDate/to/:toDate", async (req, res) => {
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
        .map(getQueryNodes)
        .map(streamResponse(res));
    await Promise.all(result);

    res.end();
});

router.get("/issue-comments/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const issueComments = await fetchIssueComments(octokit, login, fromDate, toDate);

    await Promise.all(issueComments.map(streamResponse(res)));

    res.end();
});

router.get("/commit-comments/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const commitComments = await fetchCommitComments(octokit, login, fromDate, toDate);

    await Promise.all(commitComments.map(streamResponse(res)));

    res.end();
});
