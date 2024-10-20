import {gql} from 'graphql-tag'

export const userInfo= gql`
  query userInfo($login: String!, $size: Int) {
    user(login: $login) {
      name
      bio
      id
      url
      email
      avatarUrl(size: $size)
      twitterUsername
      websiteUrl
    }
  }
`