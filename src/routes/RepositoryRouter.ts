import express, { Request, Response } from "express";

import { fetchRepositoryInfo } from "../service/RepositoryService.js";
import * as validator from "../middleware/express-validator.js";
import { Repository } from "../graphql/dto_types.js";

export { router as RepositoryRouter };

const router = express.Router();

type RepositoryRequestParams = {
    owner: string;
    name: string;
};

/**
 * @swagger
 * /api/repository/{owner}/{name}:
 *   get:
 *     summary: Get repository information
 *     description: Returns detailed information about a specific GitHub repository
 *     tags:
 *       - Repository
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Repository information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Repository'
 *       400:
 *         description: Validation error in request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequestParamsValidationError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */
router.get(
    "/:owner/:name",
    [validator.githubOwnerParamValidator(), validator.githubNameParamValidator()],
    validator.run(),
    async (req: Request<RepositoryRequestParams>, res: Response<Repository>) => {
        const { octokit } = req;
        const { owner, name } = req.params;

        const repository = await fetchRepositoryInfo(octokit, owner, name);

        res.json(repository).end();
    }
);
