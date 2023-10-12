import { Express, Request, Response } from "express"
import { Address, parseAddresses, toMultisigAddress } from "../utils/address"
import { createMultisigProxyTeam } from "./mutation"
import { getHasuraSession } from "../user/utils"

// we assume this call will only ever be made via Hasura Action
// where input parameters are already validated
export const handleInsertMultisigProxy = async (req: Request, res: Response) => {
  try {
    const { user, error } = await getHasuraSession(req)

    if (!user || error)
      return res.status(200).json({ success: false, error: error ?? "Unauthorized" })

    const team = req.body.input.team

    const { name, chain, multisig_config, proxied_address, delegatee_address } = team

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
    const delegateeAddress = Address.fromSs58(delegatee_address)

    if (!proxiedAddress || !delegateeAddress)
      return res
        .status(200)
        .json({ success: false, error: "Invalid proxied_address or delegatee_address" })

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
    if (!multisigAddress.isEqual(delegateeAddress))
      return res.status(200).json({
        success: false,
        error: "Derived multisig address does not match delegatee address",
      })

    // TODO: On-chain check to make sure that delegatee_address is a proxy of proxy_address

    const teamData = {
      name,
      chain,
      multisig_config: {
        signers: signers.map((s) => s.toSs58()),
        threshold,
      },
      proxied_address: proxiedAddress.toSs58(),
      delegatee_address: delegateeAddress.toSs58(),
    }
    const createdTeam = await createMultisigProxyTeam(teamData)

    res.status(200).json({
      success: true,
      team: { ...teamData, id: createdTeam.id },
    })
  } catch (e) {
    console.error("Error in handleInsertMultisigProxy:")
    console.error(e)
    res.status(200).json({ success: false, error: "Internal Server Error" })
  }
}

export const handleUpdateMultisigConfig = async (req: Request, res: Response) => {
  try {
    const { user, error } = await getHasuraSession(req)

    if (!user || error)
      return res.status(200).json({ success: false, error: error ?? "Unauthorized" })
  } catch (e) {
    console.error("Error in handleUpdateMultisigConfig:")
    console.error(e)
    res.status(200).json({ success: false, error: "Internal Server Error" })
  }
}

export const createTeamHandlers = (app: Express) => {
  app.post("/team/insert-multisig-proxy", handleInsertMultisigProxy)
}
