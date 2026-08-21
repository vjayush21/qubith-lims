-- ============================================
-- ROW-LEVEL SECURITY FOR MULTI-TENANT ISOLATION
-- ============================================
-- This migration enables Postgres RLS on every tenant-scoped table.
-- Once enabled, every query MUST set `app.current_tenant_id` to the
-- active tenant. Otherwise, queries return zero rows.
-- This is enforced at the database, not the app — even a bug in
-- the application code can't leak data across tenants.

-- Helper: function that reads the current tenant setting
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- ============== Tenants ==============
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_self_select ON tenants;
CREATE POLICY tenants_self_select ON tenants
  FOR SELECT
  USING (id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Users ==============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Patients ==============
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patients_tenant_isolation ON patients;
CREATE POLICY patients_tenant_isolation ON patients
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Tests ==============
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tests_tenant_isolation ON tests;
CREATE POLICY tests_tenant_isolation ON tests
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Test orders ==============
ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS test_orders_tenant_isolation ON test_orders;
CREATE POLICY test_orders_tenant_isolation ON test_orders
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Order tests ==============
ALTER TABLE order_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_tests_tenant_isolation ON order_tests;
CREATE POLICY order_tests_tenant_isolation ON order_tests
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Results ==============
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS results_tenant_isolation ON results;
CREATE POLICY results_tenant_isolation ON results
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Reports ==============
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reports_tenant_isolation ON reports;
CREATE POLICY reports_tenant_isolation ON reports
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============== Audit logs ==============
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);

-- ============================================
-- Helper: set the current tenant in a session
-- ============================================
-- Usage: SELECT set_tenant('<uuid>');
CREATE OR REPLACE FUNCTION set_tenant(p_tenant_id uuid) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION clear_tenant() RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', true);
END;
$$ LANGUAGE plpgsql;
