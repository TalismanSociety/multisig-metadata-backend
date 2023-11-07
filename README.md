# signet-self-hosted-metadata-backend

## Setup

1. Setup your `.env` file, see `.env.sample` for example:

   - `PG_DATABASE_URL`: The postgres url to connect to your local postgres db. Replace `localhost` with `host.docker.internal`
   - `NODE_ENV`: Set to `development` if running the frontend locally via http, which will disable `secure` for SIWS cookie.
   - `HASURA_GRAPHQL_ADMIN_SECRET`: A password used to access your hasura instance. Can be any string.
   - `HASURA_GRAPHQL_JWT_SECRET`: A json object containing your JWT secret's algo and key. see `.env.sample`

2. Build all services manually. The docker setup is broken in our AWS setup now and gets stuck at install and build step. This is expected to be fixed soon, but for now, please cd into each services to run `npm install` and `npm build`.

   - Actions Service: `cd services/actions-service`
   - SIWS Service: `cd services/siws-service`

3. Run `docker compose up --build -d`. After building all services, you should be able to now run your docker compose command.

4. (Optional) Run `cd hasura && hasura console --admin-secret "{{HASURA_GRAPHQL_ADMIN_SECRET}}"` to start a Hasura dev console. A Hasura dev console will update your local `hasura` dir with all the relevant Hasura generated files that can later be used to update prod.

## Usage

- **Hasura Console**: Hasura console is accessible at `http://localhost:8080`. DO NOT change anything directly from the console.
- **Hasura Graphql Endpoint**: Check Hasura console for the graphql endpoint that the frontend can use to query data.
- **SIWS**: SIWS service needs to bind browser session with the client, and hence should reduce any proxy, including Hasura Action. Therefore, the frontend should access SIWS service directly at `http://localhost:3031`.
- **Hasura Dev Console**: Check your terminal where you execute `hasura console --admin-secret ...` command. Hasura dev console is typically accessible at `http://localhost9695`.

## Folder Structure

```
.
|-- ...
|-- hasura                      # hasura generated files (e.g. metadata, migrations, config)
|-- services                    # contains all services. In the future, we will have things like notification service
|   |-- actions-service         # node JS app that exposes APIs for Hasura actions, mainly to perform data validation and custom business logic
|   |-- siws-service            # independent SIWS service that in the future can be extracted out of the repo and hosted on serverless functions
|__ ...
```

## Known Issues

- Something is broken with the install and build script of services. You need to install and build the services locally first.
