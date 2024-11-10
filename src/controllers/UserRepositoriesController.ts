import { Request, Response } from "express";
import {
    fetchRepositoriesCommittedToInfo,
    fetchRepositoriesContributedToInfo,
} from "../service/RepositoryService.js";
import { SSEError } from "../utils/errors/SSEError.js";
import { SSEStream } from "../utils/SSEStream.js";

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

export async function getContributedToRepositories(
    req: Request<RepositoriesContributedToRequest>,
    res: Response
) {
    try {
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
    } catch (error: any) {
        throw new SSEError(error);
    }
}

export async function getCommittedToRepositories(
    req: Request<RepositoriesCommittedToRequest>,
    res: Response
) {
    try {
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
    } catch (error: any) {
        throw new SSEError(error);
    }
}
