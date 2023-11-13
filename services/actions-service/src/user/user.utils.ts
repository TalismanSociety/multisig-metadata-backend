import { Request } from "express"
import { User, getUserById } from "./user.queries"

export const getHasuraSession = async (
  req: Request
): Promise<{ user?: User; error?: string; sessionVariables: any }> => {
  const sessionVariables = req.body.session_variables
  const userId = sessionVariables?.["x-hasura-user-id"]
  const role = sessionVariables?.["x-hasura-role"]

  if (role !== "user" || !userId) return { error: "Unauthorized", sessionVariables }

  try {
    const user = await getUserById(userId)

    if (user) return { user, sessionVariables }
    return { error: "User not found.", sessionVariables }
  } catch (e) {
    console.error("Error getting user session:")
    console.error(e)
    return { error: "Failed to authenticate user.", sessionVariables }
  }
}
