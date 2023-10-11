

CREATE TABLE "public"."user" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identifier" text NOT NULL, "identifier_type" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("identifier"));
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "public"."team" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "multisig_config" json NOT NULL, "proxied_address" text NOT NULL, PRIMARY KEY ("id") );COMMENT ON TABLE "public"."team" IS E'A team represents a vault, which can be owned by an organisation later';
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_team_updated_at"
BEFORE UPDATE ON "public"."team"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_team_updated_at" ON "public"."team"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "public"."team_user_role" ("user_id" UUID NOT NULL, "team_id" UUID NOT NULL, "role" text NOT NULL, PRIMARY KEY ("user_id","team_id") , FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE restrict ON DELETE cascade, FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE restrict ON DELETE cascade);

alter table "public"."tx_metadata" add column "multisig_address" varchar
 null;

alter table "public"."tx_metadata" add column "team_id" uuid
 null;

alter table "public"."tx_metadata"
  add constraint "tx_metadata_team_id_fkey"
  foreign key ("team_id")
  references "public"."team"
  ("id") on update restrict on delete set null;

alter table "public"."team" add column "delegatee_address" text
 null;

alter table "public"."team" alter column "multisig_config" drop not null;

alter table "public"."team" alter column "proxied_address" drop not null;

alter table "public"."team" add column "name" text
 not null;

alter table "public"."team" add column "chain" text
 null;

alter table "public"."user" add constraint "user_identifier_identifier_type_key" unique ("identifier", "identifier_type");

alter table "public"."team" alter column "multisig_config" set not null;

alter table "public"."team" alter column "proxied_address" set not null;

alter table "public"."team" alter column "delegatee_address" set not null;

alter table "public"."team" alter column "chain" set not null;
