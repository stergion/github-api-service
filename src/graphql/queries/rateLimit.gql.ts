import { gql } from "graphql-tag";

export const rateLimit = gql`
query rateLimit {
  rateLimit {
    used
    remaining
    resetAt
  }
}
`;