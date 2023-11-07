import { Algorithm } from "jsonwebtoken"

export const getJwtSecret = (): { type: Algorithm; key: string } | undefined => {
  const JWT_SECRET_OBJ = process.env.HASURA_GRAPHQL_JWT_SECRET

  try {
    return JSON.parse(JWT_SECRET_OBJ || "")
  } catch (e) {
    console.error(`Failed to parse JWT secret`)
    return undefined
  }
}
