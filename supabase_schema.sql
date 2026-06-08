--
-- PostgreSQL database dump
--

\restrict Ob2lgA3y0j6zQJEjs6hL3IfmOdIO1I5BxXEGZGaOQAOqftWU43IPr0mLnvnXj1f

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: creator_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creator_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    email text NOT NULL,
    wallet_address text NOT NULL,
    encrypted_private_key text NOT NULL,
    name text NOT NULL,
    avatar_url text,
    pro boolean DEFAULT false NOT NULL
);


--
-- Name: forms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    creator_address text NOT NULL,
    title text NOT NULL,
    description text,
    tally_form_id text,
    aggregator_vault_uuid text,
    is_active boolean DEFAULT true,
    creator_id uuid NOT NULL,
    questions jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    form_id uuid,
    response_vault_uuid text NOT NULL
);


--
-- Data for Name: creator_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.creator_accounts (id, created_at, email, wallet_address, encrypted_private_key, name, avatar_url) FROM stdin;
3800e97f-3f75-4e3a-b095-75ec0bf25385	2026-05-27 11:28:53.245405+00	chijiokedivine10256@gmail.com	0x9BA6Cc3eeAf28f725DA6695C7103bE08165D206B	fced9ec908389b5d9c5da71aacd3284d:2ece3224aec60aa2a4f808acc8e461ff:f77ba160aa60ec2bd8496917a3829c509a8a45c53912076fb4dca36e9da2ccd98724d0727f3b77661eeb38d0c1b42b7db99333027ba633f7eb84ffdcbb9daf4303b0	Diverse	\N
\.


--
-- Data for Name: forms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.forms (id, created_at, creator_address, title, description, tally_form_id, aggregator_vault_uuid, is_active, creator_id, questions) FROM stdin;
837840ea-3eea-4f9a-a886-c8ce5b84af98	2026-05-27 21:35:56.030868+00	0x9BA6Cc3eeAf28f725DA6695C7103bE08165D206B	Burn or Stake	Decision to burn or stake our tokens	\N	3880	t	3800e97f-3f75-4e3a-b095-75ec0bf25385	[{"id": "0db0ad0f-2fed-4495-9b88-04287253c4ec", "type": "radio", "label": "Type \\"burn\\" for Burn / Type \\"stake\\" for Stake", "options": ["Burn", "Stake"], "required": false}]
\.


--
-- Data for Name: responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responses (id, created_at, form_id, response_vault_uuid) FROM stdin;
2daebee8-032b-4e59-8fa7-f449d14f4b78	2026-05-27 21:36:39.097423+00	837840ea-3eea-4f9a-a886-c8ce5b84af98	3881
503d69a7-fb49-40d8-9215-aca90ec461e0	2026-05-28 20:21:24.327345+00	837840ea-3eea-4f9a-a886-c8ce5b84af98	4129
\.


--
-- Name: creator_accounts creator_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_accounts
    ADD CONSTRAINT creator_accounts_email_key UNIQUE (email);


--
-- Name: creator_accounts creator_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_accounts
    ADD CONSTRAINT creator_accounts_pkey PRIMARY KEY (id);


--
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- Name: responses responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_pkey PRIMARY KEY (id);


--
-- Name: responses responses_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responses
    ADD CONSTRAINT responses_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.forms(id) ON DELETE CASCADE;


--
-- Name: forms Enable delete access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete access for all users" ON public.forms FOR DELETE USING (true);


--
-- Name: creator_accounts Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.creator_accounts FOR INSERT WITH CHECK (true);


--
-- Name: forms Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.forms FOR INSERT WITH CHECK (true);


--
-- Name: responses Enable insert access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert access for all users" ON public.responses FOR INSERT WITH CHECK (true);


--
-- Name: creator_accounts Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.creator_accounts FOR SELECT USING (true);


--
-- Name: forms Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.forms FOR SELECT USING (true);


--
-- Name: responses Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.responses FOR SELECT USING (true);


--
-- Name: creator_accounts Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.creator_accounts FOR UPDATE USING (true);


--
-- Name: forms Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.forms FOR UPDATE USING (true);


--
-- Name: responses Enable update access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update access for all users" ON public.responses FOR UPDATE USING (true);


--
-- Name: creator_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creator_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: forms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

--
-- Name: responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict Ob2lgA3y0j6zQJEjs6hL3IfmOdIO1I5BxXEGZGaOQAOqftWU43IPr0mLnvnXj1f

