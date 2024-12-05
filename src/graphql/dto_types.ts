import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

import { GetNestedType } from "../utils/UtilityTypes.js";
import {
    CommitCommentsQuery,
    CommitInfoFragment,
    IssueCommentsQuery,
    IssuesQuery,
    PullRequestReviewsQuery,
    PullRequestsQuery,
    RepositoryQuery,
    UserInfoQuery,
} from "./typed_queries.js";

export {
    Commit,
    CommitComment,
    CommitFile,
    CommitWithFiles,
    IssueNode,
    IssueComment,
    PullRequestNode,
    PullRequestReviewNode,
    Repository,
    UserInfo,
};

type UserInfo = NonNullable<UserInfoQuery["user"]>;

type CommitFile = NonNullable<
    RestEndpointMethodTypes["repos"]["getCommit"]["response"]["data"]["files"]
>[number];

type Commit = CommitInfoFragment;

type CommitWithFiles = CommitInfoFragment & { files: CommitFile[] };

type CommitComment = NonNullable<
    NonNullable<GetNestedType<CommitCommentsQuery, ["user", "commitComments", "nodes"]>>[number]
>;

type IssueComment = NonNullable<
    NonNullable<GetNestedType<IssueCommentsQuery, ["user", "issueComments", "nodes"]>>[number]
>;

type IssueNode = NonNullable<
    GetNestedType<
        IssuesQuery,
        ["user", "contributionsCollection", "issueContributions", "nodes"]
    >[number]
>;

type PullRequestNode = NonNullable<
    GetNestedType<
        PullRequestsQuery,
        ["user", "contributionsCollection", "pullRequestContributions", "nodes"]
    >[number]
>;

type PullRequestReviewNode = NonNullable<
    GetNestedType<
        PullRequestReviewsQuery,
        ["user", "contributionsCollection", "pullRequestReviewContributions", "nodes"]
    >[number]
>;

type Repository = NonNullable<RepositoryQuery["repository"]>;
