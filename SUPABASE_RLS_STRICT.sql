-- ============================================================
-- Tensa Postal Beat — STRICT Role-Based RLS Policies
-- Run this AFTER the main SUPABASE_SCHEMA.sql
-- This replaces the permissive "all authenticated" policies
-- with role-isolated access control.
-- ============================================================

-- ─── Drop existing permissive policies ───────────────────────
DROP POLICY IF EXISTS "Authenticated users can read users"          ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users"        ON users;
DROP POLICY IF EXISTS "Users can update their own record"           ON users;
DROP POLICY IF EXISTS "Authenticated users can read offices"        ON offices;
DROP POLICY IF EXISTS "Authenticated users can access areas"        ON areas;
DROP POLICY IF EXISTS "Authenticated users can access houses"       ON houses;
DROP POLICY IF EXISTS "Authenticated users can access businesses"   ON businesses;
DROP POLICY IF EXISTS "Authenticated users can access leads"        ON postal_leads;
DROP POLICY IF EXISTS "Authenticated users can access sales"        ON postal_sales;
DROP POLICY IF EXISTS "Authenticated users can access articles"     ON articles;
DROP POLICY IF EXISTS "Authenticated users can access deliveries"   ON deliveries;
DROP POLICY IF EXISTS "Authenticated users can access delivery_proofs" ON delivery_proofs;
DROP POLICY IF EXISTS "Authenticated users can access followups"    ON followups;
DROP POLICY IF EXISTS "Authenticated users can access beat_activity" ON beat_activity;

-- ─── Helper function: get current user's role ────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- ─── Helper function: get current user's office_id ───────────
CREATE OR REPLACE FUNCTION current_user_office()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT office_id FROM users WHERE id = auth.uid()
$$;

-- ─── USERS ───────────────────────────────────────────────────
-- Own profile always readable
CREATE POLICY "users_select_own"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Same office members readable (for assignment dropdowns)
CREATE POLICY "users_select_same_office"
  ON users FOR SELECT TO authenticated
  USING (office_id = current_user_office());

-- Admins and inspectors can read all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'inspector'));

-- Only admins can create users
CREATE POLICY "users_insert_admin"
  ON users FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

-- Own profile is updatable; admins can update anyone
CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin"
  ON users FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- ─── OFFICES ─────────────────────────────────────────────────
CREATE POLICY "offices_select"
  ON offices FOR SELECT TO authenticated
  USING (id = current_user_office() OR current_user_role() = 'admin');

CREATE POLICY "offices_insert_admin"
  ON offices FOR INSERT TO authenticated
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "offices_update_admin"
  ON offices FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- ─── AREAS ───────────────────────────────────────────────────
CREATE POLICY "areas_select"
  ON areas FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR office_id = current_user_office()
    OR current_user_role() IN ('admin', 'inspector')
  );

CREATE POLICY "areas_insert_admin_super"
  ON areas FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'supervisor', 'bpm_spm'));

CREATE POLICY "areas_update_admin"
  ON areas FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'supervisor', 'bpm_spm'))
  WITH CHECK (current_user_role() IN ('admin', 'supervisor', 'bpm_spm'));

-- ─── HOUSES ──────────────────────────────────────────────────
CREATE POLICY "houses_select"
  ON houses FOR SELECT TO authenticated
  USING (
    area_id IN (
      SELECT id FROM areas
      WHERE assigned_to = auth.uid()
         OR office_id = current_user_office()
    )
    OR current_user_role() IN ('admin', 'inspector')
  );

CREATE POLICY "houses_insert"
  ON houses FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'postman', 'supervisor', 'bpm_spm'));

CREATE POLICY "houses_update"
  ON houses FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  );

-- ─── BUSINESSES ──────────────────────────────────────────────
CREATE POLICY "businesses_select"
  ON businesses FOR SELECT TO authenticated
  USING (
    area_id IN (
      SELECT id FROM areas
      WHERE assigned_to = auth.uid()
         OR office_id = current_user_office()
    )
    OR current_user_role() IN ('admin', 'inspector')
  );

CREATE POLICY "businesses_insert"
  ON businesses FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'postman', 'supervisor', 'bpm_spm'));

CREATE POLICY "businesses_update"
  ON businesses FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  );

-- ─── ARTICLES ────────────────────────────────────────────────
CREATE POLICY "articles_select"
  ON articles FOR SELECT TO authenticated
  USING (
    assigned_postman = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'inspector', 'bpm_spm')
  );

CREATE POLICY "articles_insert"
  ON articles FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'supervisor', 'bpm_spm'));

CREATE POLICY "articles_update"
  ON articles FOR UPDATE TO authenticated
  USING (
    assigned_postman = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  )
  WITH CHECK (
    assigned_postman = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm')
  );

-- ─── DELIVERIES ──────────────────────────────────────────────
CREATE POLICY "deliveries_select"
  ON deliveries FOR SELECT TO authenticated
  USING (
    postman_id = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'inspector', 'bpm_spm')
  );

CREATE POLICY "deliveries_insert"
  ON deliveries FOR INSERT TO authenticated
  WITH CHECK (postman_id = auth.uid());

CREATE POLICY "deliveries_update"
  ON deliveries FOR UPDATE TO authenticated
  USING (postman_id = auth.uid() OR current_user_role() = 'admin')
  WITH CHECK (postman_id = auth.uid() OR current_user_role() = 'admin');

-- ─── DELIVERY PROOFS ─────────────────────────────────────────
-- Delivery proofs are linked to articles — let the postman who created
-- the delivery read/write proofs for their own articles
CREATE POLICY "delivery_proofs_select"
  ON delivery_proofs FOR SELECT TO authenticated
  USING (
    article_id IN (SELECT article_id FROM deliveries WHERE postman_id = auth.uid())
    OR current_user_role() IN ('admin', 'supervisor', 'inspector', 'bpm_spm')
  );

CREATE POLICY "delivery_proofs_insert"
  ON delivery_proofs FOR INSERT TO authenticated
  WITH CHECK (
    article_id IN (SELECT article_id FROM deliveries WHERE postman_id = auth.uid())
    OR current_user_role() IN ('admin', 'supervisor')
  );

-- ─── POSTAL LEADS ────────────────────────────────────────────
CREATE POLICY "leads_select"
  ON postal_leads FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm', 'inspector')
  );

CREATE POLICY "leads_insert"
  ON postal_leads FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'postman', 'supervisor', 'bpm_spm'));

CREATE POLICY "leads_update"
  ON postal_leads FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (assigned_to = auth.uid() OR current_user_role() IN ('admin', 'supervisor'));

-- ─── POSTAL SALES ────────────────────────────────────────────
CREATE POLICY "sales_select"
  ON postal_sales FOR SELECT TO authenticated
  USING (
    sold_by = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'bpm_spm', 'inspector')
  );

CREATE POLICY "sales_insert"
  ON postal_sales FOR INSERT TO authenticated
  WITH CHECK (sold_by = auth.uid());

-- ─── FOLLOWUPS ───────────────────────────────────────────────
CREATE POLICY "followups_select"
  ON followups FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'inspector')
  );

CREATE POLICY "followups_insert"
  ON followups FOR INSERT TO authenticated
  WITH CHECK (
    assigned_to = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "followups_update"
  ON followups FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR current_user_role() IN ('admin', 'supervisor'))
  WITH CHECK (assigned_to = auth.uid() OR current_user_role() IN ('admin', 'supervisor'));

-- ─── BEAT ACTIVITY ───────────────────────────────────────────
CREATE POLICY "beat_activity_select"
  ON beat_activity FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR current_user_role() IN ('admin', 'supervisor', 'inspector', 'bpm_spm')
  );

CREATE POLICY "beat_activity_insert"
  ON beat_activity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ─── Performance Indexes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_assigned_postman ON articles(assigned_postman);
CREATE INDEX IF NOT EXISTS idx_articles_barcode           ON articles(barcode);
CREATE INDEX IF NOT EXISTS idx_articles_status            ON articles(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_postman_id      ON deliveries(postman_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_article_id      ON deliveries(article_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_article_id ON delivery_proofs(article_id);
CREATE INDEX IF NOT EXISTS idx_houses_area_id             ON houses(area_id);
CREATE INDEX IF NOT EXISTS idx_businesses_area_id         ON businesses(area_id);
CREATE INDEX IF NOT EXISTS idx_postal_leads_assigned      ON postal_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_postal_leads_status        ON postal_leads(status);
CREATE INDEX IF NOT EXISTS idx_postal_sales_sold_by       ON postal_sales(sold_by);
CREATE INDEX IF NOT EXISTS idx_followups_assigned         ON followups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_beat_activity_user_id      ON beat_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_beat_activity_timestamp    ON beat_activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_office_id            ON users(office_id);
CREATE INDEX IF NOT EXISTS idx_areas_office_id            ON areas(office_id);
CREATE INDEX IF NOT EXISTS idx_areas_assigned_to          ON areas(assigned_to);
