import axios from "axios"
import { CreateUserByIdentifierMutation, GetUserByIdentifierQuery } from "./types"

const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || ""
const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT || ""

const HASURA_GRAPHQL_ENDPOINT = `${HASURA_ENDPOINT}/v1/graphql`
const ADMIN_SECRET_HEADER = {
  "Content-Type": "application/json",
  "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
}
const GET_USER_BY_IDENTIFIER_QUERY = `
    query GetUserByIdentifier($identifier: String!) {
      user(where: {identifier: {_eq: $identifier}}) {
        id
        identifier
        identifier_type
      }
    }
`

const CREATE_USER_BY_IDENTIFIER_MUTATION = `
    mutation CreateUserByIdentifier($identifier: String!, $identifierType: String!) {
      insert_user_one(object:{
        identifier: $identifier,
        identifier_type: $identifierType
      }) {
        id
        identifier
        identifier_type
      }
    }
`

export const getUserByIdentifier = async (identifier: string) => {
  const result = await axios.post<GetUserByIdentifierQuery>(
    HASURA_GRAPHQL_ENDPOINT,
    { query: GET_USER_BY_IDENTIFIER_QUERY, variables: { identifier } },
    { headers: ADMIN_SECRET_HEADER }
  )

  return result.data.data.user[0]
}

export const createUserByIdentifier = async (identifier: string, identifierType: string) => {
  const result = await axios.post<CreateUserByIdentifierMutation>(
    HASURA_GRAPHQL_ENDPOINT,
    { query: CREATE_USER_BY_IDENTIFIER_MUTATION, variables: { identifier, identifierType } },
    { headers: ADMIN_SECRET_HEADER }
  )

  return result.data.data.insert_user_one
}

export const getOrCreateUserByIdentifier = async (identifier: string, identifierType: string) => {
  let user = await getUserByIdentifier(identifier)
  if (!user) {
    // create user
    user = await createUserByIdentifier(identifier, identifierType)
  }

  return { user }
}
