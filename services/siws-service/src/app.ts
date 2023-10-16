import express from "express"
import Session from "express-session"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import cors from "cors"
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto"
import { getOrCreateUserByIdentifier } from "./user"
import { getJwtSecret } from "./utils"

require("dotenv").config()

const app = express()
const jwtSecret = getJwtSecret()

if (!jwtSecret) throw Error("Failed to start service. JWT secret not provided")

app.set("trust proxy", 2)

app.use(express.json())
app.use(
  cors({
    origin: function (origin, callback) {
      return callback(null, true)
    },
    credentials: true,
  })
)

app.use(
  Session({
    name: "signet-siws",
    secret: "siwe-quickstart-secret",
    resave: true,
    saveUninitialized: true,
    proxy: true,
    cookie: { secure: true, sameSite: "none", httpOnly: true },
  })
)

app.get("/status", (req, res) => {
  res.status(200).send("OK")
})

// generates a nonce and store it in session for later verification
app.post("/nonce", async (req, res) => {
  const nonce = crypto.randomUUID()

  // @ts-ignore generate nonce and store in session
  req.session.nonce = nonce

  return res.json({ nonce })
})

// verify that user has signed a message with the nonce stored in session
app.post("/verify", async (req, res) => {
  try {
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

    // get user data from database, create if none
    const { user } = await getOrCreateUserByIdentifier(address, "ss58")

    const jwtPayload = {
      "https://hasura.io/jwt/claims": {
        "x-hasura-user-id": user.id,
        "x-hasura-allowed-roles": ["user", "public"],
        "x-hasura-default-role": "user",
      },
    }

    //make JWT token for user
    const jwtToken = jwt.sign(jwtPayload, jwtSecret.key, {
      algorithm: jwtSecret.type,
    })

    return res.json({ accessToken: jwtToken })
  } catch (e) {
    console.error(`Error in /verify`)
    console.error(e)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

app.listen(process.env.SIWS_SERVICE_PORT, () => {
  console.log(
    `SIWS service running on http://host.docker.internal:${process.env.SIWS_SERVICE_PORT}/`
  )
})
