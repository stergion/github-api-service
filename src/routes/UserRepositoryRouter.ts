import express, { Request, Response } from "express";

import {
    fetchRepositoriesCommittedToInfo,
    fetchRepositoriesContributedToInfo,
} from "../service/RepositoryService.js";
import * as validator from "../middleware/express-validator.js";
import { SSEStream } from "../utils/SSEStream.js";

export { router as UserRepositoryRouter };

const router = express.Router({ mergeParams: true });

type RepositoriesContributedToRequest = {
    login: string;
    fromDate: string;
    toDate: string;
};

type RepositoriesCommittedToRequest = {
    login: string;
    fromDate: string;
    toDate: string;
};

/**
 * @swagger
 * /api/user/{login}/repositories/contributed-to/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get repositories the user has contributed to within a date range
 *     description: Returns a stream of repositories that the user has contributed to through commits, issues, pull requests, and reviews
 *     tags:
 *       - User Repositories
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
 *         description: Start date for contributions range
 *       - name: toDate
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for contributions range
 *     responses:
 *       207:
 *         description: Stream of repositories
 *         content:
 *           text/event-stream:
 *             examples:
 *               RepositorySSEStream:
 *                 $ref: '#/components/examples/RepositorySSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a repository object
 *               properties:
 *                  data:
 *                      $ref: '#/components/schemas/Repository'
 */
router.get(
    "/contributed-to/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<RepositoriesContributedToRequest>, res: Response) => {
        const { octokit } = req;
        const { login, fromDate, toDate } = req.params;

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
    }
);

/**
 * @swagger
 * /api/user/{login}/repositories/committed-to/from/{fromDate}/to/{toDate}:
 *   get:
 *     summary: Get repositories the user has committed to within a date range
 *     description: Returns a stream of repositories that the user has directly committed code to
 *     tags:
 *       - User Repositories
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
 *         description: Stream of repositories
 *         content:
 *           text/event-stream:
 *             examples:
 *               RepositorySSEStream:
 *                 $ref: '#/components/examples/RepositorySSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a repository object
 *               properties:
 *                  data:
 *                      $ref: '#/components/schemas/Repository'
 */
router.get(
    "/repositories/committed-to/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    async (req: Request<RepositoriesCommittedToRequest>, res: Response) => {
        const { octokit } = req;
        const { login, fromDate, toDate } = req.params as typeof req.params & {
            login: string;
        };

        const stream = new SSEStream(res);

        const it = fetchRepositoriesCommittedToInfo(
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
    }
);
