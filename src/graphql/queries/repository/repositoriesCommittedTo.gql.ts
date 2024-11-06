import { gql } from "graphql-tag";

export const repositoriesCommittedTo = gql`
query repositoriesCommittedTo(
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