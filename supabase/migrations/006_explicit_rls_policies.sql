-- =====================================================
-- Explicit RLS policies (Migration 006)
-- =====================================================
-- 既存の RLS policies(004 + 005)を明示的な形式に書き換える。
--
-- 背景:
--   PostgreSQL の RLS は USING のみ指定された場合、自動的にそれを WITH CHECK にも
--   適用するため、現状でも INSERT / UPDATE は正しくガードされている。
--   しかし「USING だけで INSERT も守られる」事実は PostgreSQL の暗黙挙動に依存し、
--   レビュアーが見て安全性が即座に理解できない。
--
-- このマイグレーションは Sakigake の DDD "機械的に強制" 思想に従い、
-- すべての RLS policy に FOR ALL / USING / WITH CHECK を明示する。
--
-- セキュリティ的な挙動の変化:
--   なし(意味論的には等価、表現が明示化されるだけ)
--
-- 顧客への教育的価値:
--   - INSERT / UPDATE / DELETE / SELECT の各操作で何が起きるか policy を読んで分かる
--   - 顧客が独自の RLS policy を追加する際の正しい template として機能する
--
-- 関連: ADR-0002 (Clerk → Supabase 認証連携)

-- ---------- tenants ----------
DROP POLICY IF EXISTS "tenant_isolation" ON tenants;

CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL
  USING (clerk_organization_id = (auth.jwt() ->> 'org_id'))
  WITH CHECK (clerk_organization_id = (auth.jwt() ->> 'org_id'));

-- ---------- tenant_memberships ----------
DROP POLICY IF EXISTS "membership_tenant_isolation" ON tenant_memberships;

CREATE POLICY "membership_tenant_isolation" ON tenant_memberships
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );

-- ---------- subscriptions ----------
DROP POLICY IF EXISTS "subscription_tenant_isolation" ON subscriptions;

CREATE POLICY "subscription_tenant_isolation" ON subscriptions
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );

-- ---------- projects ----------
DROP POLICY IF EXISTS "project_tenant_isolation" ON projects;

CREATE POLICY "project_tenant_isolation" ON projects
  FOR ALL
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  )
  WITH CHECK (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );
