import { gql } from "graphql-tag";

export const commitComments = gql`
    query userCommitComments($login: String!, $cursor: String) {
        user(login: $login) {
            commitComments(last: 100, before: $cursor) {
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
                    commit {
                        id
                        url
                    }
                    repository {
                        owner {
                            login
                        }
                        name
                    }
                    position
                    body
                    reactions {
                        totalCount
                    }
                }
            }
        }
    }
`;
