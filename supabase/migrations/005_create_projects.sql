-- =====================================================
-- projects テーブル (example context)
-- =====================================================
-- example bounded context の Project Aggregate を永続化する。
-- 顧客は自分のドメイン (Note / Document / Customer / Order 等) を作るとき、
-- このマイグレーションを参考にして自分のテーブルを追加する。

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived')),
  owner_id      TEXT NOT NULL,  -- Clerk user ID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- 一覧表示は tenant_id でフィルタするので必須
CREATE INDEX idx_projects_tenant_id ON projects (tenant_id);

-- status 別のフィルタ (active のみ等) を高速化
CREATE INDEX idx_projects_tenant_status ON projects (tenant_id, status);

-- =====================================================
-- Row Level Security
-- =====================================================
-- ログインユーザーが所属する tenant の Project のみアクセス可能。
-- Clerk JWT の org_id から該当 tenant の id を引いて一致確認する。

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_tenant_isolation" ON projects
  USING (
    tenant_id = (
      SELECT id FROM tenants
      WHERE clerk_organization_id = (auth.jwt() ->> 'org_id')
    )
  );
