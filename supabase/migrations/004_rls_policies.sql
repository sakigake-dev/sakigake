-- =====================================================
-- Row Level Security (RLS) policies
-- =====================================================
-- Sakigake のマルチテナント分離の根幹。
-- Clerk JWT の org_id claim を使って、ログインユーザーが所属する
-- tenant のデータのみアクセス可能にする。
--
-- service role (Clerk webhook 等の管理処理) は RLS を bypass するので、
-- Domain Repository を service role で使う際は明示的に書く必要がある。

-- ---------- tenants ----------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON tenants
  USING (clerk_organization_id = (auth.jwt() ->> 'org_id'));

-- ---------- tenant_memberships ----------
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_tenant_isolation" ON tenant_memberships
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );

-- ---------- subscriptions ----------
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_tenant_isolation" ON subscriptions
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );
