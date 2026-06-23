-- ============================================================
-- Tensa Postal Beat — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Offices ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_name TEXT NOT NULL,
  office_type TEXT NOT NULL,
  office_code TEXT NOT NULL UNIQUE,
  pincode     TEXT NOT NULL
);

-- ─── Users ──────────────────────────────────────────────────────────────────
-- Note: auth.users is managed by Supabase Auth.
-- This table stores the profile data linked to each auth user.
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  employee_id   TEXT NOT NULL UNIQUE,
  designation   TEXT NOT NULL,
  mobile        TEXT,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','inspector','supervisor','postman','bpm_spm')),
  office_id     UUID REFERENCES offices(id) ON DELETE SET NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Areas ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  beat_number TEXT NOT NULL,
  office_id   UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Houses ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS houses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id        UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  house_number   TEXT NOT NULL,
  head_of_family TEXT NOT NULL,
  mobile         TEXT,
  address        TEXT NOT NULL,
  latitude       NUMERIC(10, 7),
  longitude      NUMERIC(10, 7),
  remarks        TEXT,
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Businesses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id       UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  owner_name    TEXT NOT NULL,
  mobile        TEXT,
  category      TEXT NOT NULL,
  address       TEXT NOT NULL,
  latitude      NUMERIC(10, 7),
  longitude     NUMERIC(10, 7),
  assigned_to   UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Postal Leads ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS postal_leads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_type      TEXT NOT NULL,
  prospect_name  TEXT NOT NULL,
  mobile         TEXT NOT NULL,
  source         TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  remarks        TEXT,
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Postal Sales ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS postal_sales (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name  TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,
  sale_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  sold_by       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ─── Articles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode          TEXT NOT NULL UNIQUE,
  article_type     TEXT NOT NULL,
  sender           TEXT NOT NULL,
  receiver         TEXT NOT NULL,
  address          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'in_transit'
                   CHECK (status IN ('in_transit','out_for_delivery','delivered','failed','returned')),
  assigned_postman UUID REFERENCES users(id) ON DELETE SET NULL,
  scanned_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Deliveries ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('delivered','failed','attempted')),
  delivered_at    TIMESTAMPTZ,
  postman_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remarks         TEXT
);

-- ─── Delivery Proofs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_proofs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id   UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  image_url    TEXT,
  latitude     NUMERIC(10, 7),
  longitude    NUMERIC(10, 7),
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Follow-ups ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followups (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  notes          TEXT,
  follow_up_date DATE NOT NULL,
  completed      BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to    UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ─── Beat Activity ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beat_activity (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude      NUMERIC(10, 7) NOT NULL,
  longitude     NUMERIC(10, 7) NOT NULL,
  activity_type TEXT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_leads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_sales   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE beat_activity  ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write their own data
-- (Adjust these policies based on your security requirements)

CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Users can update their own record"
  ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can read offices"
  ON offices FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access areas"
  ON areas FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access houses"
  ON houses FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access businesses"
  ON businesses FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access leads"
  ON postal_leads FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access sales"
  ON postal_sales FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access articles"
  ON articles FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access deliveries"
  ON deliveries FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access delivery_proofs"
  ON delivery_proofs FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access followups"
  ON followups FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can access beat_activity"
  ON beat_activity FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- ─── Sample Data ─────────────────────────────────────────────────────────────
-- Run AFTER creating your first user via Supabase Auth
-- Replace 'YOUR_USER_UUID' with the actual UUID from auth.users

-- Sample Office
INSERT INTO offices (id, office_name, office_type, office_code, pincode)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mumbai GPO', 'Head Post Office', 'MUM-GPO-001', '400001'),
  ('00000000-0000-0000-0000-000000000002', 'Andheri Sub Post Office', 'Sub Post Office', 'MUM-AND-002', '400069')
ON CONFLICT DO NOTHING;

-- Sample Areas (assign to your office)
INSERT INTO areas (id, name, beat_number, office_id)
VALUES
  ('00000000-0000-0000-0001-000000000001', 'Sector A - Andheri West', 'BEAT-001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0001-000000000002', 'Sector B - Andheri East', 'BEAT-002', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;
