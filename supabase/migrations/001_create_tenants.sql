CREATE TABLE tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_organization_id TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'suspended')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS の USING 句で毎行参照されるため必須
CREATE INDEX idx_tenants_clerk_org_id ON tenants (clerk_organization_id);
