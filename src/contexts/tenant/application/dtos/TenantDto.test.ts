import { describe, it, expect } from "vitest";
import { toTenantDto } from "./TenantDto";
import { Tenant } from "../../domain/models/Tenant";
import { TenantName } from "../../domain/valueObjects/TenantName";
import { ClerkOrganizationId } from "../../domain/valueObjects/ClerkOrganizationId";
import { UserId } from "../../domain/valueObjects/UserId";
import { MemberRole } from "../../domain/valueObjects/MemberRole";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { TenantStatus } from "../../domain/valueObjects/TenantStatus";
import { TenantMembership } from "../../domain/models/TenantMembership";

function makeActiveTenant(): Tenant {
  const tenant = Tenant.create(
    TenantName.from("山田会計事務所"),
    ClerkOrganizationId.from("org_yamada001"),
  );
  tenant.pullDomainEvents();
  return tenant;
}

describe("toTenantDto", () => {
  describe("基本フィールドの変換", () => {
    it("id が string で返される", () => {
      const tenant = makeActiveTenant();
      const dto = toTenantDto(tenant);
      expect(typeof dto.id).toBe("string");
    });

    it("name が正しく文字列化される", () => {
      const tenant = makeActiveTenant();
      const dto = toTenantDto(tenant);
      expect(dto.name).toBe("山田会計事務所");
    });

    it("clerkOrganizationId が正しく文字列化される", () => {
      const tenant = makeActiveTenant();
      const dto = toTenantDto(tenant);
      expect(dto.clerkOrganizationId).toBe("org_yamada001");
    });

    it("status が 'active' として文字列化される", () => {
      const tenant = makeActiveTenant();
      const dto = toTenantDto(tenant);
      expect(dto.status).toBe("active");
    });

    it("status が 'suspended' として文字列化される", () => {
      const tenant = makeActiveTenant();
      tenant.suspend();
      const dto = toTenantDto(tenant);
      expect(dto.status).toBe("suspended");
    });
  });

  describe("memberships の変換", () => {
    it("memberships が空のテナントは空配列を返す", () => {
      const tenant = makeActiveTenant();
      const dto = toTenantDto(tenant);
      expect(dto.memberships).toEqual([]);
    });

    it("owner を追加すると memberships に1件含まれる", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_owner001"), MemberRole.owner());
      const dto = toTenantDto(tenant);
      expect(dto.memberships).toHaveLength(1);
    });

    it("membership の userClerkId が正しく文字列化される", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_owner001"), MemberRole.owner());
      const dto = toTenantDto(tenant);
      expect(dto.memberships[0].userClerkId).toBe("user_owner001");
    });

    it("membership の role が正しく文字列化される (owner)", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_owner001"), MemberRole.owner());
      const dto = toTenantDto(tenant);
      expect(dto.memberships[0].role).toBe("owner");
    });

    it("membership の role が正しく文字列化される (member)", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_member001"), MemberRole.member());
      const dto = toTenantDto(tenant);
      expect(dto.memberships[0].role).toBe("member");
    });

    it("membership の createdAt が ISO 8601 文字列で返される", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_owner001"), MemberRole.owner());
      const dto = toTenantDto(tenant);
      expect(dto.memberships[0].createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it("複数メンバーが全員 dto.memberships に含まれる", () => {
      const tenant = makeActiveTenant();
      tenant.addMember(UserId.from("user_owner001"), MemberRole.owner());
      tenant.addMember(UserId.from("user_admin001"), MemberRole.admin());
      tenant.addMember(UserId.from("user_member001"), MemberRole.member());
      const dto = toTenantDto(tenant);
      expect(dto.memberships).toHaveLength(3);
      const roles = dto.memberships.map((m) => m.role);
      expect(roles).toContain("owner");
      expect(roles).toContain("admin");
      expect(roles).toContain("member");
    });
  });

  describe("reconstruct されたテナントの変換", () => {
    it("reconstruct で構築したテナントも正しく変換できる", () => {
      const id = TenantId.generate();
      const owner = new TenantMembership(
        UserId.from("user_owner001"),
        MemberRole.owner(),
        new Date("2026-01-15T09:00:00.000Z"),
      );
      const tenant = Tenant.reconstruct(
        id,
        TenantName.from("鈴木税務事務所"),
        ClerkOrganizationId.from("org_suzuki001"),
        TenantStatus.active(),
        [owner],
      );

      const dto = toTenantDto(tenant);

      expect(dto.id).toBe(id.value);
      expect(dto.name).toBe("鈴木税務事務所");
      expect(dto.clerkOrganizationId).toBe("org_suzuki001");
      expect(dto.status).toBe("active");
      expect(dto.memberships).toHaveLength(1);
      expect(dto.memberships[0].userClerkId).toBe("user_owner001");
      expect(dto.memberships[0].createdAt).toBe("2026-01-15T09:00:00.000Z");
    });
  });
});
