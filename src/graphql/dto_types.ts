import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

import { GetNestedType } from "../utils/UtilityTypes.js";
import {
    CommitCommentsQuery,
    CommitInfoFragment,
    IssueCommentsQuery,
    IssuesQuery,
    PullRequestReviewsQuery,
    PullRequestsQuery,
    RepositoriesCommitedToQuery,
    RepositoriesContributedToQuery,
    UserInfoQuery,
} from "./typed_queries.js";

export {
    Commit,
    CommitComment,
    CommitFile,
    CommitWithFiles,
    Issue,
    IssueComment,
    PullRequest,
    PullRequestReviews,
    NonNullableUserInfoQuery as UserInfo,
};

type NonNullableUserInfoQuery = Omit<UserInfoQuery, "user"> & {
    user: NonNullable<UserInfoQuery["user"]>;
};

type CommitFile = NonNullable<
    RestEndpointMethodTypes["repos"]["getCommit"]["response"]["data"]["files"]
>[number];

type Commit = CommitInfoFragment;

type CommitWithFiles = CommitInfoFragment & { files: CommitFile[] };

type CommitComment = NonNullable<
    GetNestedType<CommitCommentsQuery, ["user", "commitComments", "nodes"]>
>[number];

type IssueComment = NonNullable<
    GetNestedType<IssueCommentsQuery, ["user", "issueComments", "nodes"]>
>[number];

type Issue = NonNullable<
    GetNestedType<
        IssuesQuery,
        ["user", "contributionsCollection", "issueContributions", "nodes"]
    >[number]
>;

type PullRequest = NonNullable<
    GetNestedType<
        PullRequestsQuery,
        ["user", "contributionsCollection", "pullRequestContributions", "nodes"]
    >[number]
>;

type PullRequestReviews = NonNullable<
    GetNestedType<
        PullRequestReviewsQuery,
        ["user", "contributionsCollection", "pullRequestReviewContributions", "nodes"]
    >[number]
>;
