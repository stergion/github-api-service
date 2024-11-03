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

/**
 * @swagger
 * /api/user/{login}/contributions/commits/{owner}/{name}/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get user's commits to a specific repository within a date range
 *     description: Returns a stream of commits that the user has made to the specified repository
 *     parameters:
 *       - name: login
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *       - name: owner
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository owner's username
 *       - name: name
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Repository name
 *       - name: fromDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for commits range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for commits range
 *     responses:
 *       200:
 *         description: Stream of commits
 *         content:
 *           text/event-stream:
 *             examples:
 *               CommitSSEStream:
 *                 $ref: '#/components/examples/CommitsSSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a commit object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CommitWithFiles'
 */
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

/**
 * @swagger
 * /api/user/{login}/contributions/issues/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get issues created by the user within a date range
 *     description: Returns a stream of issues that the user has created
 *     parameters:
 *       - name: login
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *       - name: fromDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for issues range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for issues range
 *     responses:
 *       200:
 *         description: Stream of issues
 *         content:
 *           text/event-stream:
 *             examples:
 *               IssueSSEStream:
 *                 $ref: '#/components/examples/IssuesSSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains an issue object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Issue'
 */
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
