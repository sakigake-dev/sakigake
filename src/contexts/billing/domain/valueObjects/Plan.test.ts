import { describe, it, expect } from "vitest";
import { Plan } from "./Plan";
import { DomainError } from "../errors/DomainError";

describe("Plan", () => {
  describe("ファクトリメソッド", () => {
    it("free() は value が 'free' の Plan を返す", () => {
      const plan = Plan.free();
      expect(plan.value).toBe("free");
    });

    it("starter() は value が 'starter' の Plan を返す", () => {
      const plan = Plan.starter();
      expect(plan.value).toBe("starter");
    });

    it("professional() は value が 'professional' の Plan を返す", () => {
      const plan = Plan.professional();
      expect(plan.value).toBe("professional");
    });
  });

  describe("from()", () => {
    it("'free' 文字列から Plan を生成できる", () => {
      const plan = Plan.from("free");
      expect(plan.value).toBe("free");
    });

    it("'starter' 文字列から Plan を生成できる", () => {
      const plan = Plan.from("starter");
      expect(plan.value).toBe("starter");
    });

    it("'professional' 文字列から Plan を生成できる", () => {
      const plan = Plan.from("professional");
      expect(plan.value).toBe("professional");
    });

    it("無効な文字列は DomainError を投げる", () => {
      expect(() => Plan.from("enterprise")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => Plan.from("")).toThrow(DomainError);
    });

    it("'individual' は DomainError を投げる (Phase 4 で名称変更予定)", () => {
      expect(() => Plan.from("individual")).toThrow(DomainError);
    });
  });

  describe("monthlyPriceJpy()", () => {
    it("free プランの月額は 0 円", () => {
      expect(Plan.free().monthlyPriceJpy()).toBe(0);
    });

    it("starter プランの月額は 3980 円", () => {
      expect(Plan.starter().monthlyPriceJpy()).toBe(3980);
    });

    it("professional プランの月額は 15000 円", () => {
      expect(Plan.professional().monthlyPriceJpy()).toBe(15000);
    });
  });

  describe("equals()", () => {
    it("同じ value の Plan は等値である", () => {
      expect(Plan.free().equals(Plan.free())).toBe(true);
      expect(Plan.starter().equals(Plan.starter())).toBe(true);
      expect(Plan.professional().equals(Plan.professional())).toBe(true);
    });

    it("異なる value の Plan は等値でない", () => {
      expect(Plan.free().equals(Plan.starter())).toBe(false);
      expect(Plan.starter().equals(Plan.professional())).toBe(false);
    });

    it("from() と static factory の結果は等値である", () => {
      expect(Plan.from("starter").equals(Plan.starter())).toBe(true);
    });
  });
});
