import express from "express";
import { print } from "graphql";

import { ResultOf, VariablesOf } from "@graphql-typed-document-node/core";
import {
    CommitCommentsDocument,
    CommitsDocument,
    IssueCommentsDocument,
    IssuesDocument,
    PullRequestReviewsDocument,
    PullRequestsDocument,
    UserInfoDocument
} from "../graphql/typed_queries.js";
import { DateWindows } from "../utils/DateWindows.js";
import NotGithubUser from "../utils/errors/NotGithubUser.js";
import { getQueryNodes } from "./helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "./helpers/sendQueries.js";
import { streamResponse } from "./helpers/sendStreamChunk.js";
import { windowDateFilter } from "./helpers/windowDateFilter.js";

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

    const userInfoVariables: VariablesOf<typeof UserInfoDocument> = {
        login,
    };
    const userInfo = await octokit.graphql<ResultOf<typeof UserInfoDocument>>(
        print(UserInfoDocument),
        userInfoVariables
    );

    if (!userInfo.user) {
        throw new NotGithubUser(login);
    }

    const commitsQueryVariables: VariablesOf<typeof CommitsDocument> = {
        owner,
        name,
        authorId: userInfo.user.id,
        fromDate,
        toDate,
        cursor: null,
    };

    const commitsQueryFn = sendQueryWindowedPaginated(
        octokit,
        CommitsDocument,
        commitsQueryVariables
    );
    const commitsQueryResult = await commitsQueryFn([fromDate, toDate]);
    const commits = await getQueryNodes(commitsQueryResult);

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

    const queryVariables: VariablesOf<typeof IssueCommentsDocument> = {
        login: login,
        cursor: null,
    };
    const it = octokit.graphql.paginate.iterator<ResultOf<typeof IssueCommentsDocument>>(
        print(IssueCommentsDocument),
        queryVariables
    );

    const issueComments = [];
    const dateFilterPropertyName = "publishedAt";

    for await (const queryResult of it) {
        const nodesArray = await getQueryNodes(queryResult);
        issueComments.push(...nodesArray);
        // Stop fetching if issue comment go too far back in time.
        if (!!nodesArray.length && fromDate > new Date(nodesArray[0][dateFilterPropertyName]))
            break;
    }

    await Promise.all(
        issueComments
            .filter(windowDateFilter(dateFilterPropertyName, fromDate, toDate))
            .map(streamResponse(res))
    );
    res.end();
});

router.get("/commit-comments/from/:fromDate/to/:toDate", async (req, res) => {
    const { octokit } = req;
    const { login } = req.params as typeof req.params & { login: string };
    const fromDate = new Date(req.params.fromDate);
    const toDate = new Date(req.params.toDate);

    const queryVariables: VariablesOf<typeof CommitCommentsDocument> = {
        login: login,
        cursor: null,
    };
    const it = octokit.graphql.paginate.iterator<ResultOf<typeof CommitCommentsDocument>>(
        print(CommitCommentsDocument),
        queryVariables
    );

    const commitComments = [];
    const dateFilterPropertyName = "publishedAt";

    for await (const queryResult of it) {
        const nodesArray = await getQueryNodes(queryResult);
        commitComments.push(...nodesArray);
        // Stop fetching if issue comment go too far back in time.
        if (!!nodesArray.length && fromDate > new Date(nodesArray[0][dateFilterPropertyName]))
            break;
    }

    await Promise.all(
        commitComments
            .filter(windowDateFilter(dateFilterPropertyName, fromDate, toDate))
            .map(streamResponse(res))
    );
    res.end();
});
