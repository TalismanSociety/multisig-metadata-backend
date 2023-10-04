SET check_function_bodies = false;
CREATE TABLE public.tx_metadata (
    created timestamp with time zone DEFAULT now() NOT NULL,
    call_data text NOT NULL,
    multisig character varying(48) NOT NULL,
    timepoint_height integer NOT NULL,
    description character varying(100) NOT NULL,
    chain text NOT NULL,
    timepoint_index integer NOT NULL,
    change_config_details json
);
ALTER TABLE ONLY public.tx_metadata
    ADD CONSTRAINT tx_metadata_pkey PRIMARY KEY (multisig, timepoint_height, chain, timepoint_index);
