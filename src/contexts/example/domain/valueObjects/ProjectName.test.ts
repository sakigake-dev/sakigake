import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { ProjectName } from "./ProjectName";

describe("ProjectName", () => {
  describe("from()", () => {
    it("通常の文字列から生成できる", () => {
      expect(ProjectName.from("My Project").value).toBe("My Project");
    });

    it("前後の空白はトリムされる", () => {
      expect(ProjectName.from("  Trimmed  ").value).toBe("Trimmed");
    });

    it("空文字列は DomainError", () => {
      expect(() => ProjectName.from("")).toThrow(DomainError);
      expect(() => ProjectName.from("   ")).toThrow(DomainError);
    });

    it("100 文字ちょうどは OK", () => {
      const value = "a".repeat(100);
      expect(ProjectName.from(value).value).toBe(value);
    });

    it("101 文字以上は DomainError", () => {
      const value = "a".repeat(101);
      expect(() => ProjectName.from(value)).toThrow(DomainError);
    });

    it("日本語が含まれていても OK", () => {
      expect(ProjectName.from("私のプロジェクト").value).toBe("私のプロジェクト");
    });
  });

  describe("equals()", () => {
    it("同じ値なら true", () => {
      expect(ProjectName.from("foo").equals(ProjectName.from("foo"))).toBe(true);
    });

    it("異なる値なら false", () => {
      expect(ProjectName.from("foo").equals(ProjectName.from("bar"))).toBe(false);
    });
  });
});
