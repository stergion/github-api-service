import { gql } from "graphql-tag";

export const repositoryInfo = gql`
    query repository($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
            owner {
                login
            }
            name
            id
            url
            labels(first: 100) {
                totalCount
                nodes {
                    name
                    description
                }
            }
            languages(first: 50) {
                edges {
                    size
                    node {
                        name
                    }
                }
                totalCount
                totalSize
            }
            repositoryTopics(first: 50) {
                totalCount
                nodes {
                    topic {
                        name
                    }
                }
            }
            primaryLanguage {
                name
            }
            stargazerCount
            forkCount
            watchers {
                totalCount
            }
        }
    }
`;
