/**
 * Supabase DB 行 ↔ Tenant Aggregate マッピング関数。
 *
 * 純粋関数として export することで、Repository 本体を DI なしにテスト可能にする
 * (Unit テストで Supabase HTTP 呼び出しを避けるため)。
 */

import { Tenant } from "../../domain/models/Tenant";
import { TenantMembership } from "../../domain/models/TenantMembership";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { TenantName } from "../../domain/valueObjects/TenantName";
import { ClerkOrganizationId } from "../../domain/valueObjects/ClerkOrganizationId";
import { TenantStatus } from "../../domain/valueObjects/TenantStatus";
import { UserId } from "../../domain/valueObjects/UserId";
import { MemberRole } from "../../domain/valueObjects/MemberRole";

export interface TenantRow {
  id: string;
  clerk_organization_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MembershipRow {
  id: string;
  tenant_id: string;
  clerk_user_id: string;
  role: string;
  created_at: string;
}

export interface TenantDbRow {
  id: string;
  clerk_organization_id: string;
  name: string;
  status: string;
}

export interface MembershipDbRow {
  tenant_id: string;
  clerk_user_id: string;
  role: string;
}

/**
 * DB 行 → Tenant Aggregate。
 * Tenant.reconstruct() を通じてドメイン不変条件 (最低1 owner、重複なし) を検証する。
 */
export function tenantRowToDomain(
  tenantRow: TenantRow,
  membershipRows: MembershipRow[],
): Tenant {
  const memberships = membershipRows.map(
    (row) =>
      new TenantMembership(
        UserId.from(row.clerk_user_id),
        MemberRole.from(row.role),
        new Date(row.created_at),
      ),
  );

  return Tenant.reconstruct(
    TenantId.from(tenantRow.id),
    TenantName.from(tenantRow.name),
    ClerkOrganizationId.from(tenantRow.clerk_organization_id),
    TenantStatus.from(tenantRow.status),
    memberships,
  );
}

/**
 * Tenant Aggregate → テナント DB 行。
 * Domain Events は永続化しない。
 * 将来 outbox pattern を導入する際はここで events を別テーブル行に変換する
 * (Application 層が pullDomainEvents() を呼んで処理する設計は変わらない)。
 */
export function tenantToRow(tenant: Tenant): TenantDbRow {
  return {
    id: tenant.id.value,
    clerk_organization_id: tenant.clerkOrganizationId.value,
    name: tenant.name.value,
    status: tenant.status.value,
  };
}

/**
 * Tenant Aggregate の memberships → メンバーシップ DB 行リスト。
 */
export function membershipsToRows(tenant: Tenant): MembershipDbRow[] {
  return tenant.memberships.map((m) => ({
    tenant_id: tenant.id.value,
    clerk_user_id: m.userId.value,
    role: m.role.value,
  }));
}
