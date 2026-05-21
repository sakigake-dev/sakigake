import { describe, it, expect } from "vitest";
import { UserId } from "./UserId";
import { DomainError } from "../errors/DomainError";

describe("UserId", () => {
  describe("from()", () => {
    it("'user_' prefix を持つ値から UserId を生成できる", () => {
      const id = UserId.from("user_abc123");
      expect(id.value).toBe("user_abc123");
    });

    it("'user_' prefix がない値は DomainError を投げる", () => {
      expect(() => UserId.from("abc123")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => UserId.from("")).toThrow(DomainError);
    });

    it("'org_' prefix は DomainError を投げる", () => {
      expect(() => UserId.from("org_abc123")).toThrow(DomainError);
    });

    it("Clerk の実際のユーザーID形式を受け付ける", () => {
      const id = UserId.from("user_2abc123XYZ");
      expect(id.value).toBe("user_2abc123XYZ");
    });
  });

  describe("equals()", () => {
    it("同じ value の UserId は等値である", () => {
      const a = UserId.from("user_abc");
      const b = UserId.from("user_abc");
      expect(a.equals(b)).toBe(true);
    });

    it("異なる value の UserId は等値でない", () => {
      const a = UserId.from("user_aaa");
      const b = UserId.from("user_bbb");
      expect(a.equals(b)).toBe(false);
    });

    it("自身と比較した場合は等値である", () => {
      const id = UserId.from("user_self");
      expect(id.equals(id)).toBe(true);
    });
  });
});
