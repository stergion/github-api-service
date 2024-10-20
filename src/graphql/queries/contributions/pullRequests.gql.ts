import { gql } from "graphql-tag";

const commitInfoLeanFragment = gql`
    fragment commitInfoLean on Commit {
        id
        commitUrl
        changedFiles
        additions
        deletions
    }
`;

export const pullRequests = gql`
    query pullRequests($login: String!, $fromDate: DateTime, $toDate: DateTime, $cursor: String) {
        user(login: $login) {
            name
            login
            contributionsCollection(from: $fromDate, to: $toDate) {
                startedAt
                endedAt
                pullRequestContributions(first: 40, after: $cursor) {
                    totalCount
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                    nodes {
                        pullRequest {
                            repository {
                                owner {
                                    login
                                }
                                name
                            }
                            id
                            url
                            createdAt
                            mergedAt
                            closedAt
                            updatedAt
                            state
                            reactions {
                                totalCount
                            }
                            labels(first: 10) {
                                totalCount
                                nodes {
                                    name
                                    description
                                }
                            }
                            title
                            body
                            commits(first: 10) {
                                totalCount
                                nodes {
                                    commit {
                                        ...commitInfoLean
                                    }
                                }
                            }
                            comments {
                                totalCount
                            }
                            closingIssuesReferences(first: 10) {
                                nodes {
                                    id
                                    url
                                }
                                totalCount
                            }
                        }
                    }
                }
            }
        }
    }
    ${commitInfoLeanFragment}
`;
