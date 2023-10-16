import { Request } from "express"
import { User, getUserById } from "./user.queries"

export const getHasuraSession = async (req: Request): Promise<{ user?: User; error?: string }> => {
  const userId = req.body.session_variables?.["x-hasura-user-id"]
  const role = req.body.session_variables?.["x-hasura-role"]

  if (role !== "user" || !userId) return { error: "Unauthorized" }

  try {
    const user = await getUserById(userId)

    if (user) return { user }
    return { error: "User not found." }
  } catch (e) {
    console.error("Error getting user session:")
    console.error(e)
    return { error: "Failed to authenticate user." }
  }
}
