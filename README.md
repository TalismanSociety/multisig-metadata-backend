# signet-self-hosted-metadata-backend

## Setup

1. Setup your `.env` file, see `.env.sample` for example:

   - `PG_DATABASE_URL`: The postgres url to connect to your local postgres db. Replace `localhost` with `host.docker.internal` if you're running locally.
   - `NODE_ENV`: Set to `development` if running the frontend locally via http, which will disable `secure` for SIWS cookie.
   - `HASURA_GRAPHQL_ADMIN_SECRET`: A password used to access your hasura instance. Can be any string.
   - `HASURA_GRAPHQL_JWT_SECRET`: A json object containing your JWT secret's algo and key. see `.env.sample`

2. Run `docker compose up --build -d` to build and start the services.

<<<<<<< Updated upstream
3. (Optional) Run `cd hasura && hasura console --admin-secret "{{HASURA_GRAPHQL_ADMIN_SECRET}}"` to start a Hasura dev console. Only changes made via your Hasura dev console will update your local `hasura` dir with all the relevant Hasura generated files that can later be used to update prod.
=======
3. You should be able to access the services at the url below:

   - SIWS Service: `http://localhost:3031`
   - Hasura Graphql Endpoint: `http://localhost:8080`

4. (Optional) Run `cd hasura && hasura console --admin-secret "{{HASURA_GRAPHQL_ADMIN_SECRET}}"` to start a Hasura dev console. Only changes made via your Hasura dev console will update your local `hasura` dir with all the relevant Hasura generated files that can later be used to update prod.
>>>>>>> Stashed changes

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

## Future improvement

- [ ] Build a github action that when a PR is created: - install and build all services within github workflow - build docker image and push to AWS ECR - trigger build on a preview instance

## Deploy Script

`rsync -e "ssh -i $HOME/.ssh/signet_aws.pem" -rP signet-backend signet-metadata-1a: --exclude signet-backend/.env`
