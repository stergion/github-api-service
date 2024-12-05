import { Request, Response } from "express";

import {
    IssuesDocument,
    IssuesQueryVariables,
    PullRequestReviewsDocument,
    PullRequestReviewsQueryVariables,
    PullRequestsDocument,
    PullRequestsQueryVariables,
} from "../graphql/typed_queries.js";
import { getQueryNodes } from "../routes/helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "../routes/helpers/sendQueries.js";
import {
    fetchCommitComments,
    fetchIssueComments,
    fetchRepositoryCommits,
} from "../service/ContributionsService.js";
import { fetchUserInfo } from "../service/UserService.js";
import { DateWindows } from "../utils/DateWindows.js";
import { SSEError } from "../utils/errors/SSEError.js";
import { SSEStream } from "../utils/SSEStream.js";
import { Issue, IssueNode, PullRequest, PullRequestNode, PullRequestReview, PullRequestReviewNode } from "../graphql/dto_types.js";

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

export async function getCommits(req: Request<CommitRequestParams>, res: Response) {
    try {
        const { octokit } = req;
        const { login, owner, name } = req.params;
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

export async function getIssues(req: Request<IssueRequestParams>, res: Response) {
    try {
        const { octokit } = req;
        const { login, fromDate, toDate } = req.params;

        const stream = new SSEStream(res);

        const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

        const issuesQueryVariables: IssuesQueryVariables = {
            login: login,
            // cursor: null,
        };

        let result = dateWindows
            .map(sendQueryWindowedPaginated(octokit, IssuesDocument, issuesQueryVariables))
            .map(getQueryNodes)
            .map(async (i) =>  (await i).map((i:IssueNode):Issue => i.issue))
            .map(stream.streamResponse.bind(stream));
        await Promise.all(result);

        res.end();
    } catch (error: any) {
        throw new SSEError(error);
    }
}

export async function getPullRequests(req: Request<PullRequestRequestParams>, res: Response) {
    try {
        const { octokit } = req;
        const { login, fromDate, toDate } = req.params;

        const stream = new SSEStream(res);

        const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

        const pullRequestsVariables: PullRequestsQueryVariables = {
            login: login,
            fromDate: null,
            toDate: null,
            cursor: null,
        };

        const result = dateWindows
            .map(sendQueryWindowedPaginated(octokit, PullRequestsDocument, pullRequestsVariables))
            .map(getQueryNodes)
            .map(async (i) =>  (await i).map((i:PullRequestNode):PullRequest => i.pullRequest))
            .map(stream.streamResponse.bind(stream));
        await Promise.all(result);

        res.end();
    } catch (error: any) {
        throw new SSEError(error);
    }
}

export async function getPullRequestReviews(
    req: Request<PullRequestReviewsRequestParams>,
    res: Response
) {
    try {
        const { octokit } = req;
        const { login, fromDate, toDate } = req.params as typeof req.params;

        const dateWindows = new DateWindows(new Date(toDate), new Date(fromDate)).monthly();

        const pullrequestReviewsVariables: PullRequestReviewsQueryVariables = {
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
            .map(async (i) =>  (await i).map((i:PullRequestReviewNode):PullRequestReview => i.pullRequestReview))
            .map(stream.streamResponse.bind(stream));
        await Promise.all(result);

        res.end();
    } catch (error: any) {
        throw new SSEError(error);
    }
}

export async function getIssueComments(req: Request<IssueCommentsRequestParams>, res: Response) {
    try {
        const { octokit } = req;
        const { login } = req.params;

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

export async function getCommitComments(req: Request<CommitCommentsRequestParams>, res: Response) {
    try {
        const { octokit } = req;
        const { login } = req.params;
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
