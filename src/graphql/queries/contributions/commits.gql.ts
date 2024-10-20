import { gql } from "graphql-tag";


const commitInfoFragment = gql`
fragment commitInfo on Commit {
  id
  oid
  commitUrl
  committedDate
  pushedDate
  changedFiles
  additions
  deletions
  message
  comments(first: 10) {
    nodes {
      author {
        login
      }
      publishedAt
      position
      reactions {
        totalCount
      }
      body
    }
  }
  associatedPullRequests(first: 10) {
    nodes {
      id
      url
    }
  }
}
`;

export const commits = gql`
query commits (
  $owner: String!
  $name: String!
  $authorId: ID!
  $fromDate: GitTimestamp
  $toDate: GitTimestamp
  $cursor: String
) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(author: { id: $authorId }, since: $fromDate, until: $toDate, after: $cursor) {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }
            nodes {
              ...commitInfo
            }
          }
        }
      }
    }
  }
}
${commitInfoFragment}
`;