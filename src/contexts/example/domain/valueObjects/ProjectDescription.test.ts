import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { ProjectDescription } from "./ProjectDescription";

describe("ProjectDescription", () => {
  describe("from()", () => {
    it("通常の文字列から生成できる", () => {
      expect(ProjectDescription.from("これは説明です").value).toBe("これは説明です");
    });

    it("空文字列でも生成できる (isEmpty true)", () => {
      const d = ProjectDescription.from("");
      expect(d.value).toBe("");
      expect(d.isEmpty()).toBe(true);
    });

    it("1000 文字ちょうどは OK", () => {
      const value = "a".repeat(1000);
      expect(ProjectDescription.from(value).value).toBe(value);
    });

    it("1001 文字以上は DomainError", () => {
      const value = "a".repeat(1001);
      expect(() => ProjectDescription.from(value)).toThrow(DomainError);
    });
  });

  describe("empty()", () => {
    it("空の ProjectDescription を返す", () => {
      const d = ProjectDescription.empty();
      expect(d.value).toBe("");
      expect(d.isEmpty()).toBe(true);
    });
  });

  describe("isEmpty()", () => {
    it("中身があれば false", () => {
      expect(ProjectDescription.from("test").isEmpty()).toBe(false);
    });
  });

  describe("equals()", () => {
    it("同じ値なら true", () => {
      expect(
        ProjectDescription.from("foo").equals(ProjectDescription.from("foo")),
      ).toBe(true);
    });

    it("異なる値なら false", () => {
      expect(
        ProjectDescription.from("foo").equals(ProjectDescription.from("bar")),
      ).toBe(false);
    });
  });
});
