FROM hasura/graphql-engine:v2.28.0.cli-migrations-v3

WORKDIR /hasura

ENV HASURA_GRAPHQL_MIGRATIONS_DIR=/hasura/migrations \
    HASURA_GRAPHQL_METADATA_DIR=/hasura/metadata \
    HASURA_GRAPHQL_SEEDS_DIR=/hasura/seeds


COPY . .

EXPOSE 8080