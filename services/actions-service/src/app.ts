import "@polkadot/api-augment/substrate"

import express from "express"

import { createTxMetadataHandlers, handleInsertTxMetadataValidated } from "./tx_metadata/handler"
import { createTeamHandlers } from "./team/handler"

const app = express()
app.use(express.json())

createTxMetadataHandlers(app)
createTeamHandlers(app)

app.listen(3030, () => {
  console.log("Webhook service running on http://localhost:3000/")
})
