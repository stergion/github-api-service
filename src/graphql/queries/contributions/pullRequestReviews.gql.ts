import { gql } from "graphql-tag";

export const pullRequestReviews = gql`
    query pullRequestReviews(
        $login: String!
        $fromDate: DateTime
        $toDate: DateTime
        $cursor: String
    ) {
        user(login: $login) {
            login
            contributionsCollection(from: $fromDate, to: $toDate) {
                startedAt
                endedAt
                pullRequestReviewContributions(first: 100, after: $cursor) {
                    totalCount
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                    nodes {
                        pullRequestReview {
                            repository {
                                owner {
                                    login
                                }
                                name
                            }
                            pullRequest {
                                id
                                url
                            }
                            createdAt
                            updatedAt
                            publishedAt
                            submittedAt
                            lastEditedAt
                            id
                            url
                            state
                            body
                            comments(first: 50) {
                                totalCount
                                nodes {
                                    author {
                                        login
                                    }
                                    id
                                    url
                                    body
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;
