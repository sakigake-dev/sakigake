import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { ProjectStatus } from "./ProjectStatus";

describe("ProjectStatus", () => {
  describe("factories", () => {
    it("active() は value が 'active'", () => {
      expect(ProjectStatus.active().value).toBe("active");
    });

    it("archived() は value が 'archived'", () => {
      expect(ProjectStatus.archived().value).toBe("archived");
    });
  });

  describe("from()", () => {
    it("'active' から生成できる", () => {
      expect(ProjectStatus.from("active").value).toBe("active");
    });

    it("'archived' から生成できる", () => {
      expect(ProjectStatus.from("archived").value).toBe("archived");
    });

    it("無効な値は DomainError", () => {
      expect(() => ProjectStatus.from("unknown")).toThrow(DomainError);
      expect(() => ProjectStatus.from("")).toThrow(DomainError);
    });
  });

  describe("isActive() / isArchived()", () => {
    it("active は isActive true / isArchived false", () => {
      const s = ProjectStatus.active();
      expect(s.isActive()).toBe(true);
      expect(s.isArchived()).toBe(false);
    });

    it("archived は isActive false / isArchived true", () => {
      const s = ProjectStatus.archived();
      expect(s.isActive()).toBe(false);
      expect(s.isArchived()).toBe(true);
    });
  });

  describe("equals()", () => {
    it("同じ値なら true", () => {
      expect(ProjectStatus.active().equals(ProjectStatus.active())).toBe(true);
    });

    it("異なる値なら false", () => {
      expect(ProjectStatus.active().equals(ProjectStatus.archived())).toBe(false);
    });
  });
});
