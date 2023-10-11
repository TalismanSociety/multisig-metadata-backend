import { hasuraRequest } from "../lib/hasura"

export const getUserById = async (
  id: string
): Promise<{
  id: string
  identifier: string
  identifier_type: string
}> => {
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

  return userQuery.data.user_by_pk
}
