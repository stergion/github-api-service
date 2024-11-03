import express from "express";
import { fetchRepositoryInfo } from "../service/RepositoryService.js";

export { router as RepositoryRouter };

const router = express.Router();

/**
 * @swagger
 * /api/repository/{owner}/{name}:
 *   get:
 *     summary: Get repository information
 *     description: Returns detailed information about a specific GitHub repository
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
 */
router.get("/:owner/:name", async (req, res) => {
    const { octokit } = req;
    const { owner, name } = req.params

    const repository = await fetchRepositoryInfo(octokit, owner, name);

    res.json(repository).end();
});
