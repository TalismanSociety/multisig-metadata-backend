
alter table "public"."team" alter column "delegatee_address" set not null;

comment on column "public"."team"."delegatee_address" is E'Optional delegatee address in case the delegated proxy is not a multisig.';
