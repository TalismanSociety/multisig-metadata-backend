import "@polkadot/api-augment/substrate"

import express from "express"

import { createTxMetadataHandlers } from "./tx_metadata/tx_metadata.handlers"
import { createTeamHandlers } from "./team/team.handlers"

const app = express()
app.use(express.json())

createTxMetadataHandlers(app)
createTeamHandlers(app)

app.listen(3030, () => {
  console.log("Webhook service running on http://localhost:3000/")
})
