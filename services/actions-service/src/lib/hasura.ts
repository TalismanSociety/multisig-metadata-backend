import axios from "axios"
import { CONFIG } from "./config"

export const hasuraRequest = async (query: string, variables: any) => {
  const result = await axios.post(
    `${CONFIG.HASURA_ENDPOINT}/v1/graphql`,
    { query, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": CONFIG.HASURA_ADMIN_SECRET,
      },
    }
  )

  return result.data
}
