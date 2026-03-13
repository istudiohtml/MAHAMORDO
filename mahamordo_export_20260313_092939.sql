--
-- PostgreSQL database dump
--

\restrict gFatGnjI7cLmG8OGkLovQbVg2HPL2aEkt81lA9FSPiaFqIoRe4RXa9k5OdWQ9Nn

-- Dumped from database version 16.13 (Homebrew)
-- Dumped by pg_dump version 16.13 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: MessageRole; Type: TYPE; Schema: public; Owner: istudiohtml
--

CREATE TYPE public."MessageRole" AS ENUM (
    'USER',
    'ASSISTANT'
);


ALTER TYPE public."MessageRole" OWNER TO istudiohtml;

--
-- Name: SessionStatus; Type: TYPE; Schema: public; Owner: istudiohtml
--

CREATE TYPE public."SessionStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'EXPIRED'
);


ALTER TYPE public."SessionStatus" OWNER TO istudiohtml;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: istudiohtml
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ADMIN',
    'SUPERADMIN'
);


ALTER TYPE public."UserRole" OWNER TO istudiohtml;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO istudiohtml;

--
-- Name: credit_logs; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.credit_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount integer NOT NULL,
    reason text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.credit_logs OWNER TO istudiohtml;

--
-- Name: fortune_sessions; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.fortune_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    topic text,
    "birthDate" timestamp(3) without time zone,
    "birthTime" text,
    status public."SessionStatus" DEFAULT 'ACTIVE'::public."SessionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "oracleId" text NOT NULL
);


ALTER TABLE public.fortune_sessions OWNER TO istudiohtml;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.messages (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    role public."MessageRole" NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO istudiohtml;

--
-- Name: oracles; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.oracles (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "avatarUrl" text,
    "systemPrompt" text NOT NULL,
    speciality text NOT NULL,
    "creditCost" integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.oracles OWNER TO istudiohtml;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO istudiohtml;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text
);


ALTER TABLE public.system_settings OWNER TO istudiohtml;

--
-- Name: users; Type: TABLE; Schema: public; Owner: istudiohtml
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    credits integer DEFAULT 3 NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "birthPlace" text,
    "birthTime" text,
    "firstName" text,
    "lastName" text
);


ALTER TABLE public.users OWNER TO istudiohtml;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
20e44b12-ade6-40a5-ae42-617ae49b3943	616870940cba097ea412bb8a5238c80c305806703d411d1658ced825344a41fc	2026-03-06 16:25:19.281606+07	20260306092519_init	\N	\N	2026-03-06 16:25:19.274412+07	1
fa24ff83-21b5-42ab-a2da-792f135de9d5	d7c766c8b38642ccd1358b7e63424076d3c454888cab93f7590b44dab94b50a4	2026-03-11 14:12:28.03374+07	20260311071228_add_oracle_and_user_role	\N	\N	2026-03-11 14:12:28.025498+07	1
0efa172e-ade3-45a9-b032-8f3f5173cb24	b2454bc8e59b4d7d98598a264e2865befbad2a5563ace891a3fff72e1961fb9a	2026-03-11 15:21:33.156738+07	20260311082133_add_system_settings	\N	\N	2026-03-11 15:21:33.151211+07	1
5c481ec3-e137-4405-b0cd-5d780727d156	d7d969118f9ccbd41f7bf5b88ce2612a7692850b53fc16de5f502d26903f7f57	2026-03-11 16:18:44.782514+07	20260311091844_add_refresh_tokens	\N	\N	2026-03-11 16:18:44.779079+07	1
701716b3-b58b-4943-80f8-371c81df09a8	47e14b8bd7e77206caad38cb8b69d267522ae4ed5dfbe98fa31cb36a2ba40e4f	2026-03-12 15:11:02.545475+07	20260312081102_add_user_profile_fields	\N	\N	2026-03-12 15:11:02.543872+07	1
\.


--
-- Data for Name: credit_logs; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.credit_logs (id, "userId", amount, reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: fortune_sessions; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.fortune_sessions (id, "userId", topic, "birthDate", "birthTime", status, "createdAt", "updatedAt", "oracleId") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.messages (id, "sessionId", role, content, "createdAt") FROM stdin;
\.


--
-- Data for Name: oracles; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.oracles (id, slug, name, title, description, "avatarUrl", "systemPrompt", speciality, "creditCost", "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmmlqkgkk0000wtm2vb5azn0l	yai-kham	ยายขาม	หมอดูผู้เฒ่าแห่งโหราศาสตร์ไทย	ผู้สืบทอดวิชาโหราศาสตร์ไทยมาหลายชั่วอายุคน อบอุ่น เมตตา และตรงไปตรงมา	\N	คุณคือ "ยายขาม" หมอดูผู้เฒ่าแห่งโหราศาสตร์ไทย อายุกว่า 80 ปี\nผู้สืบทอดวิชาจากบรรพบุรุษมาหลายชั่วอายุคน\n\nบุคลิก:\n- พูดจาอบอุ่น เมตตา แต่ตรงไปตรงมา\n- ใช้ภาษาไทยสุภาพ มีความเป็นผู้ใหญ่\n- อ้างอิงดาวนพเคราะห์ ฤกษ์ยาม วันเดือนปีเกิด\n- บางครั้งพูดถึงบุญกรรม ชาติที่แล้ว\n\nวิธีดูดวง:\n- ใช้โหราศาสตร์ไทย (ดาว 9 ดวง, ลัคนา, มหาดศา)\n- ถามวันเกิด เวลาเกิด ถ้ายังไม่มี\n- ให้คำทำนายเป็นภาษาไทย กระชับ ชัดเจน ไม่เกิน 3-4 ประโยค\n\nข้อจำกัด:\n- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง\n- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก	โหราศาสตร์ไทย	1	t	1	2026-03-11 07:47:15.812	2026-03-11 09:21:12.114
cmmlqkgku0001wtm2hvobt8ei	nang-fah	นางฟ้า	ออราเคิลแห่งไพ่ทาโรต์	สวยงามเหมือนดวงจันทร์ มีพลังงานอ่อนโยนแต่ทรงพลัง พูดจาเป็นกวีและลึกซึ้ง	\N	คุณคือ "นางฟ้า" ออราเคิลแห่งไพ่ทาโรต์ผู้ลึกลับ\nสวยงามเหมือนดวงจันทร์ มีพลังงานอ่อนโยนแต่ทรงพลัง\n\nบุคลิก:\n- พูดจาเป็นกวี ลึกซึ้ง มีเสน่ห์\n- ใช้ภาษาไทยสวยงาม บางครั้งปริศนา\n- อ้างอิงสัญลักษณ์ไพ่ทาโรต์ (Major/Minor Arcana)\n- พูดถึงพลังงาน จักรวาล และการเปลี่ยนแปลง\n\nวิธีดูดวง:\n- "หยิบไพ่" 3 ใบ (อดีต-ปัจจุบัน-อนาคต) เสมอ\n- อธิบายความหมายไพ่แต่ละใบอย่างกระชับ\n- เชื่อมโยงไพ่กับคำถามของผู้ถาม\n\nข้อจำกัด:\n- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง\n- ถ้าถามเรื่องที่เป็นอันตราย ให้เบี่ยงเป็นคำแนะนำเชิงบวก	ไพ่ทาโรต์	1	t	2	2026-03-11 07:47:15.823	2026-03-11 09:21:12.123
cmmlqkgky0002wtm2vzbyzuaa	mor-dum	หมอดำ	ผู้เชี่ยวชาญศาสตร์แห่งความมืด	ลึกลับ น่าเกรงขาม พูดน้อยแต่ทุกคำมีความหมาย ตอบตรงประเด็นเสมอ	\N	คุณคือ "หมอดำ" ผู้เชี่ยวชาญศาสตร์แห่งความมืด\nลึกลับ น่าเกรงขาม แต่ยังให้ความยุติธรรมเสมอ\n\nบุคลิก:\n- พูดน้อย แต่ทุกคำมีความหมาย\n- ใช้ภาษาไทยหนักแน่น เด็ดขาด\n- อ้างอิงพลังงานลึกลับ วิญญาณ ดวงชะตา\n- บางครั้งเตือนถึงอันตราย หรือคนที่ไม่ดี\n\nวิธีดูดวง:\n- ใช้การอ่านพลังงาน และสัญชาตญาณ\n- ตอบตรงประเด็น ไม่อ้อมค้อม\n- ถ้าเห็นอะไรน่ากังวล จะบอกตรงๆ แต่ให้ทางออกด้วย\n\nข้อจำกัด:\n- ห้ามพูดเรื่องตาย หรือโรคร้ายแรงโดยตรง\n- ห้ามสนับสนุนสิ่งผิดกฎหมาย	ศาสตร์มืด	2	t	3	2026-03-11 07:47:15.826	2026-03-11 09:21:12.127
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.refresh_tokens (id, token, "userId", "expiresAt", "createdAt") FROM stdin;
cmmlutd5l0001wtou50jphc20	28817123fa06b31455fe7b4fa94006c9702cc3dde5d98480c3eba71e8d408d8a38d45f42896f9b757fcdd156bd25ee2459efe4f2d39dde974649783455269467	cmmls87sk0007wtkqh2kmpvfp	2026-03-18 09:46:09.752	2026-03-11 09:46:09.753
cmmluu9n80003wtouwnu0mf03	1e65f66bb868c4b35372f489b6fbf7d8ff86ac84ebe616400100ad56a54a037092a9acd8bb57d054292030ce3c937a1c31982d181c5b50a020783dec40764af2	cmmls87sk0007wtkqh2kmpvfp	2026-03-18 09:46:51.859	2026-03-11 09:46:51.861
cmmlv0e85007pwtce15qloejw	c3f1d81235e17ab41049eec9e03a4ba8283c254a7cddb2e36075302275d1910a4e71ecc2c74210d785b9bdfb5dd96fc6e6d31e5c00b67315b9884553c688c481	cmmls87sk0007wtkqh2kmpvfp	2026-03-18 09:51:37.732	2026-03-11 09:51:37.733
cmmlv0o20007xwtceq2ad7h4d	3b13a64fa6d77b44615044a4c387cb696c712a2b80b2ffe6b1545e5d0478f37d3ffdb0b96f3b24c5f650f77001704958aee91161e49ffa7cff43077122ec28ab	cmmls87sk0007wtkqh2kmpvfp	2026-03-18 09:51:50.471	2026-03-11 09:51:50.472
cmmlux0w2007lwtcelctefxox	4936c33b1d612602617d83b4a5db0e0fc563df9054e928bdeda8393c230444775632ee2f1578252f95d9a6f84708bdfa25f12ec347874fd25f26b2c105fde19b	cmmls87sk0007wtkqh2kmpvfp	2026-03-18 09:49:00.481	2026-03-11 09:49:00.482
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.system_settings (id, key, value, label, "updatedAt", "updatedBy") FROM stdin;
cmmlry5ue0003wteub5lr873g	credit_price_thb	10	ราคา 1 credit (บาท)	2026-03-11 08:25:54.711	\N
cmmlry5uo0004wteum003wg40	free_credits_on_signup	3	credit ฟรีเมื่อสมัครสมาชิก	2026-03-11 08:25:54.721	\N
cmmlry5us0005wteu4c6j8jgj	max_messages_per_session	20	จำนวนข้อความสูงสุดต่อ session	2026-03-11 08:25:54.724	\N
cmmlry5v00006wteumpzl8ej2	site_maintenance	false	ปิดปรับปรุงชั่วคราว	2026-03-11 08:25:54.733	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: istudiohtml
--

COPY public.users (id, email, name, password, "createdAt", "updatedAt", credits, role, "birthDate", "birthPlace", "birthTime", "firstName", "lastName") FROM stdin;
cmmls87sk0007wtkqh2kmpvfp	superadmin@mahamordo.com	Super Admin	$2b$12$iIgf89djvGJocV44vn0VQOstgR710uk9VjlW28VJBXjEd6HGHNeGy	2026-03-11 08:33:43.797	2026-03-11 09:21:12.39	999	SUPERADMIN	\N	\N	\N	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: credit_logs credit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.credit_logs
    ADD CONSTRAINT credit_logs_pkey PRIMARY KEY (id);


--
-- Name: fortune_sessions fortune_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.fortune_sessions
    ADD CONSTRAINT fortune_sessions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: oracles oracles_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.oracles
    ADD CONSTRAINT oracles_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: oracles_slug_key; Type: INDEX; Schema: public; Owner: istudiohtml
--

CREATE UNIQUE INDEX oracles_slug_key ON public.oracles USING btree (slug);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: istudiohtml
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: istudiohtml
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: istudiohtml
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: credit_logs credit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.credit_logs
    ADD CONSTRAINT "credit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fortune_sessions fortune_sessions_oracleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.fortune_sessions
    ADD CONSTRAINT "fortune_sessions_oracleId_fkey" FOREIGN KEY ("oracleId") REFERENCES public.oracles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fortune_sessions fortune_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.fortune_sessions
    ADD CONSTRAINT "fortune_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.fortune_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: istudiohtml
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gFatGnjI7cLmG8OGkLovQbVg2HPL2aEkt81lA9FSPiaFqIoRe4RXa9k5OdWQ9Nn

