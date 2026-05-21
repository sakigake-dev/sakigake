import { describe, it, expect } from "vitest";
import { TenantId } from "./TenantId";
import { DomainError } from "../errors/DomainError";

describe("TenantId", () => {
  describe("generate()", () => {
    it("UUID 形式の値を持つ TenantId を返す", () => {
      const id = TenantId.generate();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("呼び出しごとに異なる値を返す", () => {
      const a = TenantId.generate();
      const b = TenantId.generate();
      expect(a.value).not.toBe(b.value);
    });
  });

  describe("from()", () => {
    it("任意の文字列から TenantId を生成できる", () => {
      const id = TenantId.from("abc-123");
      expect(id.value).toBe("abc-123");
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => TenantId.from("")).toThrow(DomainError);
    });

    it("空白のみの文字列は DomainError を投げる", () => {
      expect(() => TenantId.from("   ")).toThrow(DomainError);
    });
  });

  describe("equals()", () => {
    it("同じ value を持つ TenantId は等値である", () => {
      const a = TenantId.from("same-id");
      const b = TenantId.from("same-id");
      expect(a.equals(b)).toBe(true);
    });

    it("異なる value を持つ TenantId は等値でない", () => {
      const a = TenantId.from("id-a");
      const b = TenantId.from("id-b");
      expect(a.equals(b)).toBe(false);
    });

    it("自身と比較した場合は等値である", () => {
      const id = TenantId.generate();
      expect(id.equals(id)).toBe(true);
    });
  });
});
