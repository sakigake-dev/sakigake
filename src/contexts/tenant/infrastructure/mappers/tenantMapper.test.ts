/**
 * tenantMapper — Unit テスト
 *
 * Supabase HTTP 呼び出しを一切行わない純粋関数テスト。
 * DB 行 ↔ Tenant Aggregate のラウンドトリップと不変条件チェックを検証する。
 */

import { describe, expect, it } from "vitest";
import { DomainError } from "../../domain/errors/DomainError";
import {
  tenantRowToDomain,
  tenantToRow,
  membershipsToRows,
  type TenantRow,
  type MembershipRow,
} from "./tenantMapper";

const BASE_TENANT_ROW: TenantRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  clerk_organization_id: "org_test123",
  name: "山田会計事務所",
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const OWNER_MEMBERSHIP_ROW: MembershipRow = {
  id: "m1111111-1111-1111-1111-111111111111",
  tenant_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  clerk_user_id: "user_owner01",
  role: "owner",
  created_at: "2026-01-01T00:00:00.000Z",
};

const MEMBER_MEMBERSHIP_ROW: MembershipRow = {
  id: "m2222222-2222-2222-2222-222222222222",
  tenant_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  clerk_user_id: "user_member01",
  role: "member",
  created_at: "2026-01-02T00:00:00.000Z",
};

describe("tenantRowToDomain", () => {
  it("有効な tenantRow + membershipRows から Tenant Aggregate を復元できる", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);

    expect(tenant.id.value).toBe(BASE_TENANT_ROW.id);
    expect(tenant.name.value).toBe(BASE_TENANT_ROW.name);
    expect(tenant.clerkOrganizationId.value).toBe(
      BASE_TENANT_ROW.clerk_organization_id,
    );
    expect(tenant.status.value).toBe("active");
    expect(tenant.memberships).toHaveLength(1);
    expect(tenant.memberships[0].userId.value).toBe("user_owner01");
    expect(tenant.memberships[0].role.value).toBe("owner");
  });

  it("memberships が空の場合もエラーなく復元できる (メンバーなし Tenant)", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, []);

    expect(tenant.id.value).toBe(BASE_TENANT_ROW.id);
    expect(tenant.memberships).toHaveLength(0);
  });

  it("複数の memberships を正しく復元できる", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [
      OWNER_MEMBERSHIP_ROW,
      MEMBER_MEMBERSHIP_ROW,
    ]);

    expect(tenant.memberships).toHaveLength(2);
    const userIds = tenant.memberships.map((m) => m.userId.value);
    expect(userIds).toContain("user_owner01");
    expect(userIds).toContain("user_member01");
  });

  it("status が 'suspended' の Tenant を正しく復元できる", () => {
    const suspendedRow: TenantRow = { ...BASE_TENANT_ROW, status: "suspended" };
    const tenant = tenantRowToDomain(suspendedRow, [OWNER_MEMBERSHIP_ROW]);

    expect(tenant.status.value).toBe("suspended");
    expect(tenant.status.isSuspended()).toBe(true);
  });

  it("重複した clerk_user_id の DB 行は DomainError を throw する", () => {
    const duplicateMembershipRow: MembershipRow = {
      ...OWNER_MEMBERSHIP_ROW,
      id: "m9999999-9999-9999-9999-999999999999",
    };

    expect(() =>
      tenantRowToDomain(BASE_TENANT_ROW, [
        OWNER_MEMBERSHIP_ROW,
        duplicateMembershipRow,
      ]),
    ).toThrow(DomainError);
  });

  it("メンバーが存在するのに owner がいない DB 状態は DomainError を throw する", () => {
    const noOwnerRow: MembershipRow = {
      ...MEMBER_MEMBERSHIP_ROW,
      role: "member",
    };

    expect(() =>
      tenantRowToDomain(BASE_TENANT_ROW, [noOwnerRow]),
    ).toThrow(DomainError);
  });

  it("createdAt が MembershipRow から正しく復元される", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);
    const membership = tenant.memberships[0];

    expect(membership.createdAt).toEqual(
      new Date(OWNER_MEMBERSHIP_ROW.created_at),
    );
  });
});

describe("tenantToRow", () => {
  it("Tenant Aggregate から DB 行の plain object を返す", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);
    const row = tenantToRow(tenant);

    expect(row).toEqual({
      id: BASE_TENANT_ROW.id,
      clerk_organization_id: BASE_TENANT_ROW.clerk_organization_id,
      name: BASE_TENANT_ROW.name,
      status: "active",
    });
  });

  it("suspended Tenant の status が正しく行に反映される", () => {
    const suspendedRow: TenantRow = { ...BASE_TENANT_ROW, status: "suspended" };
    const tenant = tenantRowToDomain(suspendedRow, [OWNER_MEMBERSHIP_ROW]);
    const row = tenantToRow(tenant);

    expect(row.status).toBe("suspended");
  });

  it("返却オブジェクトに Domain Events は含まれない", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);
    const row = tenantToRow(tenant);

    expect(Object.keys(row)).not.toContain("domainEvents");
    expect(Object.keys(row)).not.toContain("_domainEvents");
  });
});

describe("membershipsToRows", () => {
  it("Tenant の memberships を DB 行リストに変換できる", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [
      OWNER_MEMBERSHIP_ROW,
      MEMBER_MEMBERSHIP_ROW,
    ]);
    const rows = membershipsToRows(tenant);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      tenant_id: BASE_TENANT_ROW.id,
      clerk_user_id: "user_owner01",
      role: "owner",
    });
    expect(rows[1]).toMatchObject({
      tenant_id: BASE_TENANT_ROW.id,
      clerk_user_id: "user_member01",
      role: "member",
    });
  });

  it("memberships が空の Tenant の場合は空配列を返す", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, []);
    const rows = membershipsToRows(tenant);

    expect(rows).toEqual([]);
  });

  it("各行に tenant_id が含まれる", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);
    const rows = membershipsToRows(tenant);

    expect(rows[0].tenant_id).toBe(BASE_TENANT_ROW.id);
  });
});

describe("tenantRowToDomain → tenantToRow ラウンドトリップ", () => {
  it("DB 行 → Aggregate → DB 行 が等価な plain object を返す", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [OWNER_MEMBERSHIP_ROW]);
    const row = tenantToRow(tenant);

    expect(row).toEqual({
      id: BASE_TENANT_ROW.id,
      clerk_organization_id: BASE_TENANT_ROW.clerk_organization_id,
      name: BASE_TENANT_ROW.name,
      status: BASE_TENANT_ROW.status,
    });
  });

  it("DB 行 → Aggregate → memberships 行 がラウンドトリップできる", () => {
    const tenant = tenantRowToDomain(BASE_TENANT_ROW, [
      OWNER_MEMBERSHIP_ROW,
      MEMBER_MEMBERSHIP_ROW,
    ]);
    const membershipRows = membershipsToRows(tenant);

    expect(membershipRows).toHaveLength(2);
    membershipRows.forEach((row) => {
      expect(row.tenant_id).toBe(BASE_TENANT_ROW.id);
    });
    expect(membershipRows.map((r) => r.clerk_user_id).sort()).toEqual(
      ["user_member01", "user_owner01"],
    );
  });
});
