import { describe, it, expect } from "vitest";
import { TenantStatus } from "./TenantStatus";
import { DomainError } from "../errors/DomainError";

describe("TenantStatus", () => {
  describe("ファクトリメソッド", () => {
    it("active() は value が 'active' の TenantStatus を返す", () => {
      expect(TenantStatus.active().value).toBe("active");
    });

    it("suspended() は value が 'suspended' の TenantStatus を返す", () => {
      expect(TenantStatus.suspended().value).toBe("suspended");
    });
  });

  describe("from()", () => {
    it("'active' 文字列から TenantStatus を生成できる", () => {
      expect(TenantStatus.from("active").value).toBe("active");
    });

    it("'suspended' 文字列から TenantStatus を生成できる", () => {
      expect(TenantStatus.from("suspended").value).toBe("suspended");
    });

    it("無効な文字列は DomainError を投げる", () => {
      expect(() => TenantStatus.from("inactive")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => TenantStatus.from("")).toThrow(DomainError);
    });
  });

  describe("状態判定メソッド", () => {
    it("active は isActive() が true を返す", () => {
      expect(TenantStatus.active().isActive()).toBe(true);
    });

    it("active は isSuspended() が false を返す", () => {
      expect(TenantStatus.active().isSuspended()).toBe(false);
    });

    it("suspended は isSuspended() が true を返す", () => {
      expect(TenantStatus.suspended().isSuspended()).toBe(true);
    });

    it("suspended は isActive() が false を返す", () => {
      expect(TenantStatus.suspended().isActive()).toBe(false);
    });
  });

  describe("equals()", () => {
    it("同じ value の TenantStatus は等値である", () => {
      expect(TenantStatus.active().equals(TenantStatus.active())).toBe(true);
    });

    it("異なる value の TenantStatus は等値でない", () => {
      expect(TenantStatus.active().equals(TenantStatus.suspended())).toBe(false);
    });

    it("from() と static factory の結果は等値である", () => {
      expect(TenantStatus.from("active").equals(TenantStatus.active())).toBe(true);
    });
  });
});
