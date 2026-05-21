CREATE TABLE tenant_memberships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id  TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, clerk_user_id)
);
