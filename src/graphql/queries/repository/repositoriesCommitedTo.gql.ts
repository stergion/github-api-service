import { gql } from "graphql-tag";

export const repositoriesCommitedTo = gql`
query repositoriesCommitedTo(
  $login: String!
  $fromDate: DateTime
  $toDate: DateTime
) {
  user(login: $login) {
    contributionsCollection(from: $fromDate, to: $toDate) {
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
        }
      }
    }
  }
}
`;