import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { ProjectId } from "./ProjectId";

describe("ProjectId", () => {
  describe("from()", () => {
    it("有効な UUID から生成できる", () => {
      const id = ProjectId.from("550e8400-e29b-41d4-a716-446655440000");
      expect(id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("UUID 形式でない値は DomainError を投げる", () => {
      expect(() => ProjectId.from("not-a-uuid")).toThrow(DomainError);
      expect(() => ProjectId.from("")).toThrow(DomainError);
      expect(() => ProjectId.from("123")).toThrow(DomainError);
    });
  });

  describe("generate()", () => {
    it("新しい ProjectId が UUID 形式で生成される", () => {
      const id = ProjectId.generate();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("複数回呼ぶと異なる ID が生成される", () => {
      const id1 = ProjectId.generate();
      const id2 = ProjectId.generate();
      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe("equals()", () => {
    it("同じ値なら true", () => {
      const a = ProjectId.from("550e8400-e29b-41d4-a716-446655440000");
      const b = ProjectId.from("550e8400-e29b-41d4-a716-446655440000");
      expect(a.equals(b)).toBe(true);
    });

    it("異なる値なら false", () => {
      const a = ProjectId.from("550e8400-e29b-41d4-a716-446655440000");
      const b = ProjectId.from("660e8400-e29b-41d4-a716-446655440000");
      expect(a.equals(b)).toBe(false);
    });
  });
});
