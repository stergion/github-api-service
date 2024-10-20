import { gql } from "graphql-tag";

// Paginating backwords to fetch more recent comments first.
// Index 0 of the nodes array has the comment more back in time and
// index -1 has the comment closer to now.
export const issueComments = gql`
    query issueComments($login: String!, $cursor: String) {
        user(login: $login) {
            issueComments(last: 100, before: $cursor) {
                totalCount
                pageInfo {
                    startCursor
                    hasPreviousPage
                }
                nodes {
                    id
                    url
                    createdAt
                    updatedAt
                    publishedAt
                    lastEditedAt
                    repository {
                        owner {
                            login
                        }
                        name
                    }
                    issue {
                        id
                        url
                    }
                    pullRequest {
                        id
                        url
                    }
                    body
                    reactions {
                        totalCount
                    }
                }
            }
        }
    }
`;
