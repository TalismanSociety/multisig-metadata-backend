import { hasuraRequest } from "../lib/hasura"

const CREATE_MULTISIG_PROXY_TEAM_MUTATION = `
    mutation CreateMultisigProxyTeam($team: team_insert_input!) {
        insert_team_one(object: $team) {
            id
        }
    }
`

// TODO: add creator (JWT token owner) to team if not in signer list
export const createMultisigProxyTeam = async (team: {
  name: string
  chain: string
  multisig_config: {
    signers: string[]
    threshold: number
  }
  proxied_address: string
  delegatee_address: string
}) => {
  const users = team.multisig_config.signers.map((signer) => ({
    role: "signer",
    user: {
      data: {
        identifier: signer,
        identifier_type: "ss58",
      },
      // this is upserting in Hasura, inser the user if not exists
      // the update_columns doesn't actually do anything here but is required
      on_conflict: {
        constraint: "user_identifier_identifier_type_key",
        update_columns: ["identifier"],
      },
    },
  }))
  const res = await hasuraRequest(CREATE_MULTISIG_PROXY_TEAM_MUTATION, {
    team: {
      name: team.name,
      chain: team.chain,
      multisig_config: team.multisig_config,
      proxied_address: team.proxied_address,
      delegatee_address: team.delegatee_address,
      users: {
        data: users,
      },
    },
  })

  if (res.errors) {
    const [error] = res.errors
    throw new Error(error.message)
  }

  return res.data.insert_team_one
}
