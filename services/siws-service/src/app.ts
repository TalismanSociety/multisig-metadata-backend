import express from "express"
import Session from "express-session"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import cors from "cors"
import { SiwsMessage, verifySIWS } from "@talismn/siws"
import { getOrCreateUserByIdentifier } from "./user"
import { getJwtSecret } from "./utils"

require("dotenv").config()

const app = express()
const jwtSecret = getJwtSecret()

if (!jwtSecret) throw Error("Failed to start service. JWT secret not provided")

console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
const isDev = process.env.NODE_ENV === "development"

// 2 layers of proxying - AWS load balancer and docker/caddy
if (!isDev) app.set("trust proxy", 2)

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
    cookie: isDev ? { secure: false } : { secure: true, sameSite: "none", httpOnly: true },
  })
)

app.get("/status", (req, res) => {
  res.status(200).send("OK")
})

// generates a nonce and store it in session for later verification
app.post("/nonce", async (req, res) => {
  const nonce = crypto.randomUUID()

  // @ts-ignore generate nonce and store in session to prevent replay attacks
  req.session.nonce = nonce

  return res.json({ nonce })
})

// verify that user has signed a message with the nonce stored in session
app.post("/verify", async (req, res) => {
  try {
    // @ts-ignore
    const { nonce } = req.session
    const { address, message, signature } = req.body

    // invalid session
    if (!nonce) {
      return res.status(401).json({ error: "Session missing nonce" })
    }

    // missing address or signed message
    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Invalid verification request!" })
    }

    // verify signature
    let siws: SiwsMessage
    try {
      siws = await verifySIWS(message, signature, address)
    } catch (e) {
      console.error(e)
      return res.status(401).json({ error: "Invalid Signature" })
    }

    // validate nonce
    if (siws.nonce !== nonce) {
      return res.status(401).json({ error: "Invalid nonce. Please try again." })
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

app.listen(process.env.PORT, () => {
  console.log(`SIWS service running on http://host.docker.internal:${process.env.PORT}/`)
})
