import express, { Request, Response } from "express";

import { VariablesOf } from "@graphql-typed-document-node/core";
import {
    IssuesDocument,
    PullRequestReviewsDocument,
    PullRequestsDocument,
} from "../graphql/typed_queries.js";
import * as validator from "../middleware/express-validator.js";
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
import { SSEError } from "../utils/errors/SSEError.js";

export { router as UserContributionsRouter };

const router = express.Router({ mergeParams: true });

type CommitRequestParams = {
    login: string;
    owner: string;
    name: string;
    fromDate: string;
    toDate: string;
};

type IssueRequestParams = {
    login: string;
    fromDate: string;
    toDate: string;
};

type PullRequestRequestParams = {
    login: string;
    fromDate: string;
    toDate: string;
};

type PullRequestReviewsRequestParams = {
    login: string;
    fromDate: string;
    toDate: string;
};

type IssueCommentsRequestParams = {
    login: string;
    fromDate: string;
    toDate: string;
};

type CommitCommentsRequestParams = {
    login: string;
    fromDate: string;
    toDate: string;
};

/**
 * @swagger
 * /api/user/{login}/contributions/commits/{owner}/{name}/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get user's commits to a specific repository within a date range
 *     description: Returns a stream of commits that the user has made to the specified repository
 *     tags:
 *       - User Contributions
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
 *       207:
 *         description: Stream of commits
 *         content:
 *           text/event-stream:
 *             examples:
 *               CommitSSEStream:
 *                 $ref: '#/components/examples/CommitsSSEStream'
 *               CommitsSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/CommitsSSEStreamWithValidationError'
 *               CommitsSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/CommitsSSEStreamWithUserNotFoundError'
 *               CommitsSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/CommitsSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a commit object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/CommitWithFiles'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/commits/:owner/:name/:fromDate/:toDate",
    [
        validator.loginParamValidator(),
        validator.githubOwnerParamValidator(),
        validator.githubNameParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<CommitRequestParams>, res: Response) => {
        try {
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
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);

/**
 * @swagger
 * /api/user/{login}/contributions/issues/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get issues created by the user within a date range
 *     description: Returns a stream of issues that the user has created
 *     tags:
 *       - User Contributions
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
 *       207:
 *         description: Stream of issues
 *         content:
 *           text/event-stream:
 *             examples:
 *               IssueSSEStream:
 *                 $ref: '#/components/examples/IssuesSSEStream'
 *               IssuesSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/IssuesSSEStreamWithValidationError'
 *               IssuesSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/IssuesSSEStreamWithUserNotFoundError'
 *               IssuesSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/IssuesSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains an issue object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/Issue'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/issues/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<IssueRequestParams>, res: Response) => {
        try {
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
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);

/**
 * @swagger
 * /api/user/{login}/contributions/pullrequests/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get pull requests created by the user within a date range
 *     description: Returns a stream of pull requests that the user has created
 *     tags:
 *       - User Contributions
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
 *         description: Start date for pull requests range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for pull requests range
 *     responses:
 *       207:
 *         description: Stream of pull requests
 *         content:
 *           text/event-stream:
 *             examples:
 *               PullRequestSSEStream:
 *                 $ref: '#/components/examples/PullRequestsSSEStream'
 *               PullRequestsSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/PullRequestsSSEStreamWithValidationError'
 *               PullRequestsSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/PullRequestsSSEStreamWithUserNotFoundError'
 *               PullRequestsSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/PullRequestsSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a pull request object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/PullRequest'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/pullrequests/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<PullRequestRequestParams>, res: Response) => {
        try {
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
                .map(
                    sendQueryWindowedPaginated(octokit, PullRequestsDocument, pullRequestsVariables)
                )
                .map(getQueryNodes)
                .map(stream.streamResponse.bind(stream));
            await Promise.all(result);

            res.end();
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);

/**
 * @swagger
 * /api/user/{login}/contributions/pullrequest-reviews/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get pull request reviews created by the user within a date range
 *     description: Returns a stream of pull request reviews that the user has created
 *     tags:
 *       - User Contributions
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
 *         description: Start date for pull request reviews range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for pull request reviews range
 *     responses:
 *       207:
 *         description: Stream of pull request reviews
 *         content:
 *           text/event-stream:
 *             examples:
 *               PullRequestReviewSSEStream:
 *                 $ref: '#/components/examples/PullRequestReviewsSSEStream'
 *               PullRequestReviewsSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/PullRequestReviewsSSEStreamWithValidationError'
 *               PullRequestReviewsSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/PullRequestReviewsSSEStreamWithUserNotFoundError'
 *               PullRequestReviewsSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/PullRequestReviewsSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a pull request review object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/PullRequestReview'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/pullrequest-reviews/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<PullRequestReviewsRequestParams>, res: Response) => {
        try {
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

            const stream = new SSEStream(res);
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
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);

/**
 * @swagger
 * /api/user/{login}/contributions/issue-comments/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get user's issue comments within a date range
 *     description: Returns a stream of issue comments that the user has made
 *     tags:
 *       - User Contributions
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
 *         description: Start date for issue comments range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for issue comments range
 *     responses:
 *       207:
 *         description: Stream of issue comments
 *         content:
 *           text/event-stream:
 *             examples:
 *               IssueCommentSSEStream:
 *                 $ref: '#/components/examples/IssueCommentsSSEStream'
 *               IssueCommentsSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/IssueCommentsSSEStreamWithValidationError'
 *               IssueCommentsSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/IssueCommentsSSEStreamWithUserNotFoundError'
 *               IssueCommentsSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/IssueCommentsSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains an issue comment object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/IssueComment'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/issue-comments/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<IssueCommentsRequestParams>, res: Response) => {
        try {
            const { octokit } = req;
            const { login } = req.params as typeof req.params & { login: string };

            const fromDate = new Date(req.params.fromDate);
            const toDate = new Date(req.params.toDate);

            const promises = [];
            const stream = new SSEStream(res);
            const it = fetchIssueComments(octokit, login, fromDate, toDate);
            for await (const comments of it) {
                promises.push(stream.streamResponse(comments));
            }
            await Promise.all(promises);

            res.end();
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);

/**
 * @swagger
 * /api/user/{login}/contributions/commit-comments/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get user's commit comments within a date range
 *     description: Returns a stream of comments that the user has made on commits
 *     tags:
 *       - User Contributions
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
 *         description: Start date for commit comments range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for commit comments range
 *     responses:
 *       207:
 *         description: Stream of commit comments
 *         content:
 *           text/event-stream:
 *             examples:
 *               CommitCommentSSEStream:
 *                 $ref: '#/components/examples/CommitCommentsSSEStream'
 *               CommitCommentsSSEStreamWithValidationError:
 *                 $ref: '#/components/examples/CommitCommentsSSEStreamWithValidationError'
 *               CommitCommentsSSEStreamWithUserNotFoundError:
 *                 $ref: '#/components/examples/CommitCommentsSSEStreamWithUserNotFoundError'
 *               CommitCommentsSSEStreamWithInternalServerError:
 *                 $ref: '#/components/examples/CommitCommentsSSEStreamWithInternalServerError'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a commit comment object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/CommitComment'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/RequestParamsValidationError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/NotGithubUserError'
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['error']
 *                     data:
 *                       $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/commit-comments/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<CommitCommentsRequestParams>, res: Response) => {
        try {
            const { octokit } = req;
            const { login } = req.params as typeof req.params & { login: string };
            const fromDate = new Date(req.params.fromDate);
            const toDate = new Date(req.params.toDate);

            const it = fetchCommitComments(octokit, login, fromDate, toDate);

            const stream = new SSEStream(res);
            const promises = [];
            for await (const comments of it) {
                promises.push(stream.streamResponse(comments));
            }
            await Promise.all(promises);

            res.end();
        } catch (error: any) {
            throw new SSEError(error);
        }
    }
);
