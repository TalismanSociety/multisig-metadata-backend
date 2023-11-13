alter table "public"."audit_team"
  add constraint "audit_team_team_id_fkey"
  foreign key ("team_id")
  references "public"."team"
  ("id") on update restrict on delete restrict;
