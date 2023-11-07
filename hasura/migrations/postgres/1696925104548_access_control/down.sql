
alter table "public"."team" alter column "chain" drop not null;

alter table "public"."team" alter column "delegatee_address" drop not null;

alter table "public"."team" alter column "proxied_address" drop not null;

alter table "public"."team" alter column "multisig_config" drop not null;

alter table "public"."user" drop constraint "user_identifier_identifier_type_key";


-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."team" add column "chain" text
--  null;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."team" add column "name" text
--  not null;

alter table "public"."team" alter column "proxied_address" set not null;

alter table "public"."team" alter column "multisig_config" set not null;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."team" add column "delagatee_address" text
--  null;

alter table "public"."tx_metadata" drop constraint "tx_metadata_team_id_fkey";

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."tx_metadata" add column "team_id" uuid
--  null;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "public"."tx_metadata" add column "multisig_address" varchar
--  null;

DROP TABLE "public"."team_user_role";

DROP TABLE "public"."team";

DROP TABLE "public"."user";
