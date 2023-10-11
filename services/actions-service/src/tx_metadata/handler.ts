import { Express, Request, Response } from "express"
import axios from "axios"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { Option } from "@polkadot/types-codec"
import { Multisig as OnChainMultisig } from "@polkadot/types/interfaces"
import { hexToU8a } from "@polkadot/util"
import { decodeCallData } from "./decode-call-data"
import { supportedChains } from "../supported-chains"
import { CONFIG } from "../lib/config"

interface InsertTxMetadataGqlVariables {
  timepoint_height: number
  timepoint_index: number
  call_data: string
  call_hash: string
  chain: string
  multisig_address: string
  proxy_address: string
  description: string
  change_config_details?: {
    newThreshold: number
    newMembers: string[]
  }
  team_id: string
}

export const handleInsertTxMetadataValidated = async (req: Request, res: Response) => {
  try {
    const variables: InsertTxMetadataGqlVariables = req.body.input

    console.log(
      "[/InsertTxMetadataValidated] Validating request body: ",
      JSON.stringify(variables, null, 2)
    )

    // Validate chain
    const chain = supportedChains.find((c) => c.squidIds.chainData === variables.chain)
    if (!chain) {
      console.log("[/InsertTxMetadataValidated] Chain not found")
      return res.status(400).json({ error: "Chain not found" })
    }

    // Connect to chain
    console.log(`[/InsertTxMetadataValidated] Connecting to chain ${chain.chainName}...`)
    const provider = new WsProvider(chain.rpcs.map((rpc) => rpc.url))
    const api = await ApiPromise.create({ provider })
    await api.isReady
    await api.isConnected
    console.log(`[/InsertTxMetadataValidated] Connected!`)

    if (!api.query.multisig?.multisigs) {
      throw Error("multisig.multisigs must exist on api")
    }

    // Validate call_hash is actually hash of call_data
    const decodedExt = decodeCallData(api, variables.call_data)
    if (!decodedExt) {
      console.log("[/InsertTxMetadataValidated] Invalid call_data")
      return res.status(400).json({ error: "Invalid to call_data" })
    }

    const expectedHash = decodedExt.registry.hash(decodedExt.method.toU8a()).toHex()

    if (expectedHash !== variables.call_hash) {
      console.log("[/InsertTxMetadataValidated] call_hash does not match call_data")
      return res.status(400).json({
        error: "call_hash does not match call_data",
      })
    }

    // Validate multisig exists on chain
    const opt = (await api.query.multisig.multisigs(
      variables.multisig_address,
      hexToU8a(variables.call_hash)
    )) as unknown as Option<OnChainMultisig>

    if (opt.isNone) {
      console.log("[/InsertTxMetadataValidated] Multisig not found on-chain")
      return res.status(400).json({ error: "Multisig transaction not found on chain" })
    }

    // Validated!
    const { call_hash, ...variablesToFwd } = variables
    console.log(
      "[/InsertTxMetadataValidated] Validated, inserting to DB: ",
      JSON.stringify(variablesToFwd, null, 2)
    )
    const result = await axios.post(
      `${CONFIG.HASURA_ENDPOINT}/v1/graphql`,
      {
        query: `
              mutation InsertTxMetadata(
                $timepoint_height: Int!
                $timepoint_index: Int!
                $call_data: String!
                $chain: String!
                $proxy_address: String!
                $multisig_address: String!
                $description: String!
                $change_config_details: json
                $team_id: uuid!
              ) {
                insert_tx_metadata(
                  objects: {
                    timepoint_height: $timepoint_height
                    timepoint_index: $timepoint_index
                    call_data: $call_data
                    chain: $chain
                    proxy_address: $proxy_address
                    multisig_address: $multisig_address
                    description: $description
                    change_config_details: $change_config_details
                    team_id: $team_id
                  }
                ) {
                  affected_rows
                  returning {
                    created
                  }
                }
              }
            `,
        variables: variablesToFwd,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": CONFIG.HASURA_ADMIN_SECRET,
        },
      }
    )

    console.log("[/InsertTxMetadataValidated] Done: ", JSON.stringify(result.data, null, 2))
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
}

export const createTxMetadataHandlers = (app: Express) => {
  app.post("/InsertTxMetadataValidated", handleInsertTxMetadataValidated)
}
