import { gql } from "graphql-tag";

export const issues = gql`
    query issues($login: String!, $fromDate: DateTime, $toDate: DateTime, $cursor: String) {
        user(login: $login) {
            name
            login
            contributionsCollection(from: $fromDate, to: $toDate) {
                startedAt
                endedAt
                issueContributions(first: 100, after: $cursor) {
                    totalCount
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                    nodes {
                        issue {
                            repository {
                                owner {
                                    login
                                }
                                name
                            }
                            id
                            url
                            createdAt
                            updatedAt
                            closedAt
                            state
                            title
                            body
                            timelineItems(first: 100, itemTypes: [CLOSED_EVENT]) {
                                nodes {
                                    ... on ClosedEvent {
                                        actor {
                                            login
                                        }
                                    }
                                }
                            }
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
                            comments {
                                totalCount
                            }
                        }
                    }
                }
            }
        }
    }
`;
