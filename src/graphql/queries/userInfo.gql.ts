import {gql} from 'graphql-tag'

export const userInfo= gql`
  query userInfo($login: String!, $size: Int) {
    user(login: $login) {
      id
      login
      name
      bio
      url
      email
      avatarUrl(size: $size)
      twitterUsername
      websiteUrl
    }
  }
`