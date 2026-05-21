import { describe, it, expect } from "vitest";
import { MemberRole } from "./MemberRole";
import { DomainError } from "../errors/DomainError";

describe("MemberRole", () => {
  describe("ファクトリメソッド", () => {
    it("owner() は value が 'owner' の MemberRole を返す", () => {
      expect(MemberRole.owner().value).toBe("owner");
    });

    it("admin() は value が 'admin' の MemberRole を返す", () => {
      expect(MemberRole.admin().value).toBe("admin");
    });

    it("member() は value が 'member' の MemberRole を返す", () => {
      expect(MemberRole.member().value).toBe("member");
    });
  });

  describe("from()", () => {
    it("'owner' 文字列から MemberRole を生成できる", () => {
      expect(MemberRole.from("owner").value).toBe("owner");
    });

    it("'admin' 文字列から MemberRole を生成できる", () => {
      expect(MemberRole.from("admin").value).toBe("admin");
    });

    it("'member' 文字列から MemberRole を生成できる", () => {
      expect(MemberRole.from("member").value).toBe("member");
    });

    it("無効な文字列は DomainError を投げる", () => {
      expect(() => MemberRole.from("superadmin")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => MemberRole.from("")).toThrow(DomainError);
    });
  });

  describe("isOwner()", () => {
    it("owner は true を返す", () => {
      expect(MemberRole.owner().isOwner()).toBe(true);
    });

    it("admin は false を返す", () => {
      expect(MemberRole.admin().isOwner()).toBe(false);
    });

    it("member は false を返す", () => {
      expect(MemberRole.member().isOwner()).toBe(false);
    });
  });

  describe("equals()", () => {
    it("同じ value の MemberRole は等値である", () => {
      expect(MemberRole.owner().equals(MemberRole.owner())).toBe(true);
    });

    it("異なる value の MemberRole は等値でない", () => {
      expect(MemberRole.owner().equals(MemberRole.member())).toBe(false);
    });

    it("from() と static factory の結果は等値である", () => {
      expect(MemberRole.from("owner").equals(MemberRole.owner())).toBe(true);
    });
  });
});
