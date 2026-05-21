import { describe, it, expect } from "vitest";
import { TenantName } from "./TenantName";
import { DomainError } from "../errors/DomainError";

describe("TenantName", () => {
  describe("from()", () => {
    it("有効な事務所名から TenantName を生成できる", () => {
      const name = TenantName.from("山田会計事務所");
      expect(name.value).toBe("山田会計事務所");
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => TenantName.from("")).toThrow(DomainError);
    });

    it("空白のみの文字列は DomainError を投げる", () => {
      expect(() => TenantName.from("   ")).toThrow(DomainError);
    });

    it("101文字の文字列は DomainError を投げる", () => {
      const longName = "あ".repeat(101);
      expect(() => TenantName.from(longName)).toThrow(DomainError);
    });

    it("100文字の文字列は許可される", () => {
      const maxName = "あ".repeat(100);
      expect(() => TenantName.from(maxName)).not.toThrow();
    });

    it("1文字の文字列は許可される", () => {
      expect(() => TenantName.from("A")).not.toThrow();
    });

    it("前後の空白はトリムされて保持される", () => {
      // バリデーションはトリム後の長さで行い、保持値もトリム後にする
      const name = TenantName.from("  山田会計  ");
      expect(name.value).toBe("山田会計");
    });

    it("前後空白を除くと1文字の場合は有効", () => {
      const name = TenantName.from("  A  ");
      expect(name.value).toBe("A");
    });
  });

  describe("equals()", () => {
    it("同じ value の TenantName は等値である", () => {
      const a = TenantName.from("山田会計");
      const b = TenantName.from("山田会計");
      expect(a.equals(b)).toBe(true);
    });

    it("異なる value の TenantName は等値でない", () => {
      const a = TenantName.from("山田会計");
      const b = TenantName.from("田中税務");
      expect(a.equals(b)).toBe(false);
    });
  });
});
