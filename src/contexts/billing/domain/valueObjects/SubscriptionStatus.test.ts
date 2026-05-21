import { describe, it, expect } from "vitest";
import { SubscriptionStatus } from "./SubscriptionStatus";
import { DomainError } from "../errors/DomainError";

describe("SubscriptionStatus", () => {
  describe("ファクトリメソッド", () => {
    it("active() は value が 'active' の SubscriptionStatus を返す", () => {
      expect(SubscriptionStatus.active().value).toBe("active");
    });

    it("suspended() は value が 'suspended' の SubscriptionStatus を返す", () => {
      expect(SubscriptionStatus.suspended().value).toBe("suspended");
    });

    it("canceled() は value が 'canceled' の SubscriptionStatus を返す", () => {
      expect(SubscriptionStatus.canceled().value).toBe("canceled");
    });
  });

  describe("from()", () => {
    it("'active' 文字列から SubscriptionStatus を生成できる", () => {
      expect(SubscriptionStatus.from("active").value).toBe("active");
    });

    it("'suspended' 文字列から SubscriptionStatus を生成できる", () => {
      expect(SubscriptionStatus.from("suspended").value).toBe("suspended");
    });

    it("'canceled' 文字列から SubscriptionStatus を生成できる", () => {
      expect(SubscriptionStatus.from("canceled").value).toBe("canceled");
    });

    it("無効な文字列は DomainError を投げる", () => {
      expect(() => SubscriptionStatus.from("expired")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => SubscriptionStatus.from("")).toThrow(DomainError);
    });
  });

  describe("判定メソッド", () => {
    it("active は isActive() が true を返す", () => {
      expect(SubscriptionStatus.active().isActive()).toBe(true);
    });

    it("active は isSuspended() が false を返す", () => {
      expect(SubscriptionStatus.active().isSuspended()).toBe(false);
    });

    it("active は isCanceled() が false を返す", () => {
      expect(SubscriptionStatus.active().isCanceled()).toBe(false);
    });

    it("suspended は isSuspended() が true を返す", () => {
      expect(SubscriptionStatus.suspended().isSuspended()).toBe(true);
    });

    it("suspended は isActive() が false を返す", () => {
      expect(SubscriptionStatus.suspended().isActive()).toBe(false);
    });

    it("canceled は isCanceled() が true を返す", () => {
      expect(SubscriptionStatus.canceled().isCanceled()).toBe(true);
    });

    it("canceled は isActive() が false を返す", () => {
      expect(SubscriptionStatus.canceled().isActive()).toBe(false);
    });
  });

  describe("equals()", () => {
    it("同じ value の SubscriptionStatus は等値である", () => {
      expect(SubscriptionStatus.active().equals(SubscriptionStatus.active())).toBe(true);
    });

    it("異なる value の SubscriptionStatus は等値でない", () => {
      expect(SubscriptionStatus.active().equals(SubscriptionStatus.canceled())).toBe(false);
    });
  });
});
