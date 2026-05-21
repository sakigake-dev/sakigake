import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { ProjectArchived } from "../events/ProjectArchived";
import { ProjectCreated } from "../events/ProjectCreated";
import { ProjectReactivated } from "../events/ProjectReactivated";
import { ProjectRenamed } from "../events/ProjectRenamed";
import { ProjectDescription } from "../valueObjects/ProjectDescription";
import { ProjectName } from "../valueObjects/ProjectName";
import { TenantId } from "../valueObjects/TenantId";
import { UserId } from "../valueObjects/UserId";
import { Project } from "./Project";

const TENANT_ID = TenantId.from("550e8400-e29b-41d4-a716-446655440000");
const USER_ID = UserId.from("user_owner001");
const NAME = ProjectName.from("My Project");
const DESCRIPTION = ProjectDescription.empty();

function makeProject() {
  return Project.create({
    tenantId: TENANT_ID,
    name: NAME,
    description: DESCRIPTION,
    ownerId: USER_ID,
  });
}

describe("Project", () => {
  describe("create()", () => {
    it("active な Project を生成し ProjectCreated イベントを発行する", () => {
      const project = makeProject();

      expect(project.tenantId.equals(TENANT_ID)).toBe(true);
      expect(project.name.equals(NAME)).toBe(true);
      expect(project.ownerId.equals(USER_ID)).toBe(true);
      expect(project.status.isActive()).toBe(true);

      const events = project.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProjectCreated);
    });

    it("生成された ProjectId は UUID 形式", () => {
      const project = makeProject();
      expect(project.id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}/i);
    });

    it("createdAt と updatedAt が同じ値で初期化される", () => {
      const project = makeProject();
      expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime());
    });
  });

  describe("rename()", () => {
    it("名前を変更すると updatedAt が更新され ProjectRenamed イベントを発行する", async () => {
      const project = makeProject();
      project.pullDomainEvents();
      const before = project.updatedAt;

      await new Promise((r) => setTimeout(r, 5));
      const newName = ProjectName.from("Renamed Project");
      project.rename(newName);

      expect(project.name.equals(newName)).toBe(true);
      expect(project.updatedAt.getTime()).toBeGreaterThan(before.getTime());

      const events = project.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProjectRenamed);
    });

    it("同じ名前への rename は no-op (event 発行なし)", () => {
      const project = makeProject();
      project.pullDomainEvents();

      project.rename(NAME);

      expect(project.pullDomainEvents()).toHaveLength(0);
    });

    it("archived な Project は rename 不可", () => {
      const project = makeProject();
      project.archive();
      project.pullDomainEvents();

      expect(() => project.rename(ProjectName.from("New"))).toThrow(DomainError);
    });
  });

  describe("archive()", () => {
    it("active を archived に変更し ProjectArchived イベントを発行する", () => {
      const project = makeProject();
      project.pullDomainEvents();

      project.archive();

      expect(project.status.isArchived()).toBe(true);
      const events = project.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProjectArchived);
    });

    it("既に archived な Project の archive は DomainError", () => {
      const project = makeProject();
      project.archive();
      expect(() => project.archive()).toThrow(DomainError);
    });
  });

  describe("reactivate()", () => {
    it("archived を active に戻し ProjectReactivated イベントを発行する", () => {
      const project = makeProject();
      project.archive();
      project.pullDomainEvents();

      project.reactivate();

      expect(project.status.isActive()).toBe(true);
      const events = project.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(ProjectReactivated);
    });

    it("既に active な Project の reactivate は DomainError", () => {
      const project = makeProject();
      expect(() => project.reactivate()).toThrow(DomainError);
    });
  });

  describe("pullDomainEvents()", () => {
    it("イベントを取り出した後はクリアされる", () => {
      const project = makeProject();

      expect(project.pullDomainEvents()).toHaveLength(1);
      expect(project.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("reconstitute()", () => {
    it("永続化された状態から復元できる (イベント発行なし)", () => {
      const original = makeProject();
      original.pullDomainEvents();

      const restored = Project.reconstitute({
        id: original.id,
        tenantId: original.tenantId,
        name: original.name,
        description: original.description,
        status: original.status,
        ownerId: original.ownerId,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
      });

      expect(restored.id.equals(original.id)).toBe(true);
      expect(restored.pullDomainEvents()).toHaveLength(0);
    });
  });
});
