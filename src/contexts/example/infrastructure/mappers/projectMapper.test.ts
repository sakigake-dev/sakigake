import { describe, expect, it } from "vitest";
import { Project } from "../../domain/models/Project";
import { DomainError } from "../../domain/errors/DomainError";
import { ProjectDescription } from "../../domain/valueObjects/ProjectDescription";
import { ProjectName } from "../../domain/valueObjects/ProjectName";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { UserId } from "../../domain/valueObjects/UserId";
import { fromRow, toRow, type ProjectRow } from "./projectMapper";

const VALID_ROW: ProjectRow = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  tenant_id: "660e8400-e29b-41d4-a716-446655440000",
  name: "Test Project",
  description: "A description",
  status: "active",
  owner_id: "user_owner001",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

describe("projectMapper", () => {
  describe("toRow()", () => {
    it("Domain Project から DB Row に変換できる", () => {
      const project = Project.create({
        tenantId: TenantId.from("660e8400-e29b-41d4-a716-446655440000"),
        name: ProjectName.from("Test"),
        description: ProjectDescription.from("desc"),
        ownerId: UserId.from("user_owner001"),
      });

      const row = toRow(project);

      expect(row.id).toBe(project.id.value);
      expect(row.tenant_id).toBe("660e8400-e29b-41d4-a716-446655440000");
      expect(row.name).toBe("Test");
      expect(row.description).toBe("desc");
      expect(row.status).toBe("active");
      expect(row.owner_id).toBe("user_owner001");
      expect(row.created_at).toBe(project.createdAt.toISOString());
      expect(row.updated_at).toBe(project.updatedAt.toISOString());
    });
  });

  describe("fromRow()", () => {
    it("DB Row から Domain Project を復元できる", () => {
      const project = fromRow(VALID_ROW);

      expect(project.id.value).toBe(VALID_ROW.id);
      expect(project.tenantId.value).toBe(VALID_ROW.tenant_id);
      expect(project.name.value).toBe(VALID_ROW.name);
      expect(project.description.value).toBe(VALID_ROW.description);
      expect(project.status.isActive()).toBe(true);
      expect(project.ownerId.value).toBe(VALID_ROW.owner_id);
      expect(project.createdAt.toISOString()).toBe(VALID_ROW.created_at);
      expect(project.updatedAt.toISOString()).toBe(VALID_ROW.updated_at);
    });

    it("復元された Project はイベントを持たない (reconstitute)", () => {
      const project = fromRow(VALID_ROW);
      expect(project.pullDomainEvents()).toHaveLength(0);
    });

    it("archived な Row も復元できる", () => {
      const project = fromRow({ ...VALID_ROW, status: "archived" });
      expect(project.status.isArchived()).toBe(true);
    });

    it("不正な status の Row は DomainError", () => {
      expect(() => fromRow({ ...VALID_ROW, status: "unknown" })).toThrow(
        DomainError,
      );
    });

    it("不正な UUID の Row は DomainError", () => {
      expect(() => fromRow({ ...VALID_ROW, id: "not-a-uuid" })).toThrow(
        DomainError,
      );
    });
  });

  describe("Round-trip", () => {
    it("Project → Row → Project でデータが保たれる", () => {
      const original = Project.create({
        tenantId: TenantId.from("660e8400-e29b-41d4-a716-446655440000"),
        name: ProjectName.from("Round Trip"),
        description: ProjectDescription.from("preserved"),
        ownerId: UserId.from("user_test"),
      });

      const restored = fromRow(toRow(original));

      expect(restored.id.equals(original.id)).toBe(true);
      expect(restored.tenantId.equals(original.tenantId)).toBe(true);
      expect(restored.name.equals(original.name)).toBe(true);
      expect(restored.description.equals(original.description)).toBe(true);
      expect(restored.status.equals(original.status)).toBe(true);
      expect(restored.ownerId.equals(original.ownerId)).toBe(true);
    });
  });
});
