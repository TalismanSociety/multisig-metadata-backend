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

/**
 * Does 3 things:
 * 1. remove signers that are not in the new signers list
 * 2. add new signers lists to roles
 * 3. update team's multisig_config and addresses
 *
 * Notes:
 * 1. Only signer roles are removed. In the future we may add non signer roles that should not be affected by signers config change (e.g. admin)
 * 2. If a user is signer and has non-signer role, the insert will not update their role to signer, which is expected. (See `constraint` and `update_columns` in the insert_team_user_role mutation)
 */
const UPDATE_MULTISIG_CONFIG_MUTATION = `
  mutation updateMultisigConfigMutation(
    $id: uuid!, 
    $multisigConfig: json!,
    $delegateeAddress: String!,
    $roles: [team_user_role_insert_input!]!,
    $signerAddresses: [String!]!
  ) {
    delete_team_user_role(where: {
      _and: [
        {role: {_eq: "signer"}},
        {team_id: {_eq: $id}},
        {user: {
          _and: {
            identifier: {_nin: $signerAddresses},
            identifier_type: {_eq: "ss58"}
          }
        }}
      ]
    }) {
      affected_rows
    }
    
    insert_team_user_role(
      objects: $roles
      constraint: team_user_role_user_id_team_id_key
      update_columns: [user_id, team_id]
    ) {
      affected_rows
    }
  }
`
export const updateMultisigConfig = () => {}
