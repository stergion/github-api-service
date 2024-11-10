import { Request, Response } from "express";

import { Repository } from "../graphql/dto_types.js";
import { fetchRepositoryInfo } from "../service/RepositoryService.js";

type RepositoryRequestParams = {
    owner: string;
    name: string;
};

export async function getRepository(
    req: Request<RepositoryRequestParams>,
    res: Response<Repository>
) {
    const { octokit } = req;
    const { owner, name } = req.params;

    const repository = await fetchRepositoryInfo(octokit, owner, name);

    res.json(repository).end();
}
