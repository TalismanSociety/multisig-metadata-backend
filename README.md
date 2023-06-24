# signet-self-hosted-metadata-backend

## Usage

1. Make a `.env` containing your Postgres url and desired Hasura admin pw (see `.env.sample`)

2. Run `docker compose up`

Hasura will be directly accessible on 8080, and behind a reverse proxy on 80 which also includes ratelimiting rules.

## TODO

- Validation of calldata (confirming it exists on-chain) before setting it in the DB
- Automatically restoring `hasura_metadata/metadata.json` on a fresh start
