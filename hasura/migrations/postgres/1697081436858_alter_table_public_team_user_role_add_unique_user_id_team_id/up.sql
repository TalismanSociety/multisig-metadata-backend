alter table "public"."team_user_role" add constraint "team_user_role_user_id_team_id_key" unique ("user_id", "team_id");
