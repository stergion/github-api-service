import { gql } from "graphql-tag";

export const discussions = gql`
    query discussions($login: String!) {
        user(login: $login) {
            name
            login
            repositoryDiscussions(first: 10) {
                totalCount
                edges {
                    node {
                        id
                        url
                        createdAt
                        repository {
                            owner {
                                login
                            }
                            name
                        }
                        upvoteCount
                        comments {
                            totalCount
                        }
                        title
                        bodyText
                    }
                }
            }
        }
    }
`;
