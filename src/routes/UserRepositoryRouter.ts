import express from "express";

import {
    getCommittedToRepositories,
    getContributedToRepositories,
} from "../controllers/UserRepositoriesController.js";
import * as validator from "../middleware/express-validator.js";

export { router as UserRepositoryRouter };

const router = express.Router({ mergeParams: true });

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
 *                 $ref: '#/components/examples/RepositoriesSSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a repository object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/Repository'
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
    "/contributed-to/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    getContributedToRepositories
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
 *                 $ref: '#/components/examples/RepositoriesSSEStream'
 *             schema:
 *               type: object
 *               description: Event stream where each event contains a repository object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     event:
 *                       type: string
 *                       enum: ['success']
 *                     data:
 *                       $ref: '#/components/schemas/Repository'
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
    "/repositories/committed-to/from/:fromDate/to/:toDate",
    [
        validator.loginParamValidator(),
        validator.dateParamValidator("fromDate"),
        validator.dateParamValidator("toDate"),
    ],
    validator.run(),
    getCommittedToRepositories
);
