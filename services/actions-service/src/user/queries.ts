import { hasuraRequest } from "../lib/hasura"

export type User = {
  id: string
  identifier: string
  identifier_type: string
}

export const getUserById = async (id: string): Promise<User | null> => {
  const userQuery = await hasuraRequest(
    `
        query geUserById($id: uuid!) {
            user_by_pk(id: $id) {
                id
                identifier
                identifier_type
            }
        }
    `,
    { id }
  )

  return userQuery.data.user_by_pk ?? null
}
