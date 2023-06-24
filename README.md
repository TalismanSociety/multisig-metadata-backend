# signet-self-hosted-metadata-backend

## Usage

1. Make a `.env` containing your Postgres url and desired Hasura admin pw (see `.env.sample`)

2. Run `docker compose up`

Hasura will be directly accessible on 8080, and behind a reverse proxy on 80 which also includes ratelimiting rules.

## Allow-list

The allow-list by default filters all except two queries

```graphql
query TxMetadataByPk(
  $timepoint_height: Int!
  $multisig: String!
  $chain: String!
) {
  tx_metadata_by_pk(
    multisig: $multisig
    timepoint_height: $timepoint_height
    chain: $chain
  ) {
    call_data
    description
  }
}
```

```graphql
mutation InsertTxMetadata(
  $timepoint_height: Int!
  $call_data: String!
  $chain: String!
  $multisig: String!
  $description: String!
) {
  insert_tx_metadata(
    objects: {
      timepoint_height: $timepoint_height
      call_data: $call_data
      chain: $chain
      multisig: $multisig
      description: $description
    }
  ) {
    affected_rows
    returning {
      created
    }
  }
}
```

## TODO

- Validation of calldata (confirming it exists on-chain) before setting it in the DB
- Automatically restoring `hasura_metadata/metadata.json` on a fresh start
