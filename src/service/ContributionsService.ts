import { print } from "graphql";
import { Octokit } from "octokit";

import { Commit, CommitComment, CommitWithFiles, IssueComment } from "../graphql/dto_types.js";
import {
    CommitCommentsDocument,
    CommitCommentsQuery,
    CommitCommentsQueryVariables,
    CommitInfoFragment,
    CommitsDocument,
    CommitsQueryVariables,
    IssueCommentsDocument,
    IssueCommentsQuery,
    IssueCommentsQueryVariables,
} from "../graphql/typed_queries.js";
import { getQueryNodes } from "../routes/helpers/getQueryNodes.js";
import { sendQueryWindowedPaginated } from "../routes/helpers/sendQueries.js";
import { windowDateFilter } from "../routes/helpers/windowDateFilter.js";
import { DateKeys } from "../utils/UtilityTypes.js";

export async function fetchRepositoryCommits(
    octokit: Octokit,
    authorId: string,
    owner: string,
    name: string,
    fromDate: Date,
    toDate: Date,
    options?: { noFiles?: boolean }
) {
    const defaultOptions = { noFiles: false };
    options = { ...defaultOptions, ...options };

    const fetchCommitFilesFunction = options.noFiles
        ? async (...args: any) => undefined
        : fetchCommitFiles.bind(null, octokit, owner, name);

    const injectCommitFiles = async (commit: CommitInfoFragment) => {
        const files = await fetchCommitFilesFunction(commit);
        return { ...commit, files } as CommitWithFiles;
    };

    const commitsQueryVariables: CommitsQueryVariables = {
        owner,
        name,
        authorId,
        fromDate,
        toDate,
    };

    const commitsQueryFn = sendQueryWindowedPaginated(
        octokit,
        CommitsDocument,
        commitsQueryVariables
    );

    const commitsQueryResult = commitsQueryFn([fromDate, toDate]);
    const commits = (await getQueryNodes(commitsQueryResult)) as Commit[];

    return await Promise.all(commits.map(injectCommitFiles));
}

export async function fetchCommitFiles(
    octokit: Octokit,
    owner: string,
    name: string,
    commit: CommitInfoFragment
) {
    const commitRest = await octokit.rest.repos.getCommit({ owner, repo: name, ref: commit.oid });
    return commitRest.data.files;
}

type CommitCommentDatesFilter = Extract<keyof CommitComment, DateKeys>;

export async function* fetchCommitComments(
    octokit: Octokit,
    login: string,
    fromDate: Date,
    toDate: Date,
    dateFilterPropertyName: CommitCommentDatesFilter = "publishedAt"
) {
    const queryVariables: CommitCommentsQueryVariables = {
        login: login,
    };
    const it = octokit.graphql.paginate.iterator<CommitCommentsQuery>(
        print(CommitCommentsDocument),
        queryVariables
    );

    for await (const queryResult of it) {
        const nodesArray = (await getQueryNodes(queryResult)) as CommitComment[];
        yield nodesArray.filter(windowDateFilter(dateFilterPropertyName, fromDate, toDate));
        // @ts-ignore
        // Stop fetching if issue comment go too far back in time.
        if (!!nodesArray.length && fromDate > new Date(nodesArray[0][dateFilterPropertyName]))
            break;
    }
}

type IssueCommentDatesFilter = Extract<keyof IssueComment, DateKeys>;

export async function* fetchIssueComments(
    octokit: Octokit,
    login: string,
    fromDate: Date,
    toDate: Date,
    dateFilterPropertyName: IssueCommentDatesFilter = "publishedAt"
) {
    const queryVariables: IssueCommentsQueryVariables = {
        login: login,
        cursor: null,
    };
    const it = octokit.graphql.paginate.iterator<IssueCommentsQuery>(
        print(IssueCommentsDocument),
        queryVariables
    );

    for await (const queryResult of it) {
        const nodesArray = (await getQueryNodes(queryResult)) as IssueComment[];
        yield nodesArray.filter(windowDateFilter(dateFilterPropertyName, fromDate, toDate));
        // @ts-ignore
        // Stop fetching if issue comment go too far back in time.
        if (!!nodesArray.length && fromDate > new Date(nodesArray[0][dateFilterPropertyName]))
            break;
    }
}
