import { gql } from "graphql-tag";

export const repositoriesContributedTo = gql`
query repositoriesContributedTo(
  $login: String!
  $fromDate: DateTime
  $toDate: DateTime
) {
  user(login: $login) {
    contributionsCollection(from: $fromDate, to: $toDate) {
      issueContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
        }
      }
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
        }
      }
      pullRequestContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
        }
      }
      pullRequestReviewContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
        }
      }
    }
  }
}
`;