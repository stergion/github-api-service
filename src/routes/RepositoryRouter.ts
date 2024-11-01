import express from "express";
import { fetchRepositoryInfo } from "../service/RepositoryService.js";

export { router as RepositoryRouter };

const router = express.Router();

router.get("/:owner/:name", async (req, res) => {
    const { octokit } = req;
    const { owner, name } = req.params

    const repository = await fetchRepositoryInfo(octokit, owner, name);

    res.json(repository).end();
});
