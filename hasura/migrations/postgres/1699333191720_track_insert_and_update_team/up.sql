
CREATE OR REPLACE FUNCTION track_team_updates()
    RETURNS trigger AS $BODY$
    DECLARE session_variables JSON;
    BEGIN
        -- track session variables
        session_variables := current_setting('hasura.user', 't')::JSON;
        
        -- make sure team id isn't changed
        IF NEW.id != OLD.id THEN RAISE EXCEPTION 'Cannot change team id';
        END IF;
        
        -- insert old data into audit log
        INSERT INTO audit_team(
            team_id,
            action_type,
            name,
            multisig_config,
            proxied_address,
            delegatee_address,
            chain,
            "session_variables",
            "user_id"
        ) 
        VALUES (
            OLD.id,
            'update_team',
            OLD.name,
            OLD.multisig_config,
            OLD.proxied_address,
            OLD.delegatee_address,
            OLD.chain,
            session_variables,
            (session_variables ->> 'x-hasura-user-id')::uuid
        );
        
        -- return NEW for inserting
        RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;
    
CREATE OR REPLACE TRIGGER audit_team_updates BEFORE UPDATE ON "team" FOR EACH ROW EXECUTE PROCEDURE track_team_updates();

CREATE OR REPLACE FUNCTION track_team_inserts()
    RETURNS trigger AS $BODY$
    DECLARE session_variables JSON;
    BEGIN
        -- track session variables
        session_variables := current_setting('hasura.user', 't')::JSON;
        
        -- insert new team data into audit log
        INSERT INTO audit_team(
            team_id,
            action_type,
            name,
            multisig_config,
            proxied_address,
            delegatee_address,
            chain,
            "session_variables",
            "user_id"
        ) 
        VALUES (
            NEW.id,
            'insert_team',
            NEW.name,
            NEW.multisig_config,
            NEW.proxied_address,
            NEW.delegatee_address,
            NEW.chain,
            session_variables,
            (session_variables ->> 'x-hasura-user-id')::uuid
        );
        
        -- return NEW for inserting
        RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;
    
CREATE OR REPLACE TRIGGER audit_team_inserts BEFORE INSERT ON "team" FOR EACH ROW EXECUTE PROCEDURE track_team_inserts();
