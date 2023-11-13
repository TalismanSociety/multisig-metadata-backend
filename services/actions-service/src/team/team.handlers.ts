import { Express, Request, Response } from "express"
import { Address, parseAddresses, toMultisigAddress } from "../utils/address"
import { createMultisigProxyTeam, updateMultisigConfig } from "./team.mutations"
import { getHasuraSession } from "../user/user.utils"

// we assume this call will only ever be made via Hasura Action
// where input parameters are already validated
export const handleInsertMultisigProxy = async (req: Request, res: Response) => {
  const start = performance.now()
  try {
    const { user, error } = await getHasuraSession(req)

    if (!user || error)
      return res.status(200).json({ success: false, error: error ?? "Unauthorized" })

    const team = req.body.input.team

    const { name, chain, multisig_config, proxied_address } = team

    const { signers: signersAddresses, threshold } = multisig_config as {
      signers: string[]
      threshold: number
    }

    if (
      !signersAddresses ||
      !threshold ||
      !Array.isArray(signersAddresses) ||
      typeof threshold !== "number"
    )
      return res
        .status(200)
        .json({ success: false, error: "Missing or invalid fields in multisig_config" })

    if (signersAddresses.length < threshold)
      return res
        .status(200)
        .json({ success: false, error: "Threshold cannot be greater than number of signers" })

    // validate all relevant addresses
    const proxiedAddress = Address.fromSs58(proxied_address)
    if (!proxiedAddress)
      return res.status(200).json({ success: false, error: "Invalid proxied_address" })

    // make sure all signers are valid
    const { addresses: signers, hasInvalid } = parseAddresses(signersAddresses)
    if (hasInvalid) return res.status(200).json({ success: false, error: "Invalid signer address" })

    const userAddress = Address.fromSs58(user.identifier)
    if (!userAddress) return res.status(200).json({ success: false, error: "Invalid user address" })

    // make sure creator is a signer
    if (!signers.find((s) => s.isEqual(userAddress))) {
      res.status(200).json({ success: false, error: "Creator is not signer of multisig." })
      return
    }

    const multisigAddress = toMultisigAddress(signers, threshold)

    // TODO: On-chain check to make sure that multisig is a delegatee of proxy_address

    const teamData = {
      name,
      chain,
      multisig_config: {
        signers: signers.map((s) => s.toSs58()),
        threshold,
      },
      proxied_address: proxiedAddress.toSs58(),
      delegatee_address: multisigAddress.toSs58(),
    }
    const createdTeam = await createMultisigProxyTeam(teamData, {
      "x-hasura-user-id": user.id,
    })

    res.status(200).json({
      success: true,
      team: { ...teamData, id: createdTeam.id },
    })
  } catch (e) {
    console.error("Error in handleInsertMultisigProxy:")
    console.error(e)
    res.status(200).json({ success: false, error: "Internal Server Error" })
  } finally {
    console.log(`handleInsertMultisigProxy took ${performance.now() - start} ms`)
  }
}

/**
 * Updates the multisig config of a team. Note that this does not update the
 * team data, only it's multisig configurations.
 *
 * In the future we will have `updateTeam` for admin users, which will allow them to override
 * the multisig config and other team data.
 */
export const handleUpdateMultisigConfig = async (req: Request, res: Response) => {
  const start = performance.now()
  try {
    const { user, error } = await getHasuraSession(req)

    if (!user || error)
      return res.status(200).json({ success: false, error: error ?? "Unauthorized" })

    const { teamId, changeConfigDetails } = req.body.input

    // TODO: make sure the change is in tx_metadata history, and was created by the current multisig?

    // validate changeConfigDetails, which is not validated by Hasura since it's a json
    // validate signers
    const { addresses, hasInvalid } = parseAddresses(changeConfigDetails.signers)
    if (hasInvalid) return res.status(200).json({ success: false, error: "Invalid signer address" })

    // validate threshold type
    if (typeof changeConfigDetails.threshold !== "number")
      return res.status(200).json({ success: false, error: "Invalid threshold" })

    if (changeConfigDetails.threshold > addresses.length)
      return res
        .status(200)
        .json({ success: false, error: "Threshold cannot be greater than number of signers" })

    // derive multisig address to be used as delegatee address
    const multisigAddress = toMultisigAddress(addresses, changeConfigDetails.threshold)

    const { error: updateError, success } = await updateMultisigConfig(
      teamId,
      multisigAddress.toSs58(),
      {
        signers: addresses.map((a) => a.toSs58()),
        threshold: changeConfigDetails.threshold,
      },
      { "x-hasura-user-id": user.id }
    )
    if (!success || updateError)
      return res
        .status(200)
        .json({ success: false, error: updateError ?? "Failed to update multisig config" })

    res.status(200).json({ success: true })
  } catch (e) {
    console.error("Error in handleUpdateMultisigConfig:")
    console.error(e)
    res.status(200).json({ success: false, error: "Internal Server Error" })
  } finally {
    console.log(`handleUpdateMultisigConfig took ${performance.now() - start} ms`)
  }
}

export const createTeamHandlers = (app: Express) => {
  app.post("/team/insert-multisig-proxy", handleInsertMultisigProxy)
  app.post("/team/update-multisig-config", handleUpdateMultisigConfig)
}
