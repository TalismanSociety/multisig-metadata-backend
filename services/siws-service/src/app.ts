import express from "express"
import Session from "express-session"
import crypto from "crypto"
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto"

require("dotenv").config()

const app = express()
app.use(express.json())

app.use(
  Session({
    name: "signet-siws",
    secret: "siwe-quickstart-secret",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, sameSite: true },
  })
)

// generates a nonce and store it in session for later verification
app.post("/nonce", async (req, res) => {
  const nonce = crypto.randomUUID()

  // @ts-ignore generate nonce and store in session
  req.session.nonce = nonce

  return res.json({ nonce })
})

// verify that user has signed a message with the nonce stored in session
app.post("/verify", async (req, res) => {
  console.log(req.session, req.body)
  // @ts-ignore
  const { nonce } = req.session
  const { address, signedMessage } = req.body

  // invalid session
  if (!nonce) {
    return res.status(401).json({ error: "Session missing nonce" })
  }

  // missing address or signed message
  if (!address || !signedMessage) {
    return res.status(400).json({ error: "Missing Parameters" })
  }

  // construct payload - must match payload in client
  // TODO: make a package that both frontend and backend use to construct payload
  const payload = JSON.stringify({ address, nonce }, undefined, 2)

  await cryptoWaitReady()
  const verification = signatureVerify(payload, signedMessage, address)

  // invalid signature
  if (!verification.isValid) {
    return res.status(401).json({ error: "Invalid Signature" })
  }

  // TODO: get user data from database

  // TODO: make JWT token for user

  return res.json({ accessToken: "token" })
})

app.listen(process.env.SIWS_SERVICE_PORT, () => {
  console.log(
    `Webhook service running on http://host.docker.internal:${process.env.SIWS_SERVICE_PORT}/`
  )
})
