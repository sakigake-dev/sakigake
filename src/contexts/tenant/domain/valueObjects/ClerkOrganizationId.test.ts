import { describe, it, expect } from "vitest";
import { ClerkOrganizationId } from "./ClerkOrganizationId";
import { DomainError } from "../errors/DomainError";

describe("ClerkOrganizationId", () => {
  describe("from()", () => {
    it("'org_' prefix を持つ値から ClerkOrganizationId を生成できる", () => {
      const id = ClerkOrganizationId.from("org_abc123");
      expect(id.value).toBe("org_abc123");
    });

    it("'org_' prefix がない値は DomainError を投げる", () => {
      expect(() => ClerkOrganizationId.from("abc123")).toThrow(DomainError);
    });

    it("空文字列は DomainError を投げる", () => {
      expect(() => ClerkOrganizationId.from("")).toThrow(DomainError);
    });

    it("'user_' prefix は DomainError を投げる", () => {
      expect(() => ClerkOrganizationId.from("user_abc123")).toThrow(DomainError);
    });

    it("Clerk の実際の Organization ID 形式を受け付ける", () => {
      const id = ClerkOrganizationId.from("org_2XYZabc123");
      expect(id.value).toBe("org_2XYZabc123");
    });
  });

  describe("equals()", () => {
    it("同じ value の ClerkOrganizationId は等値である", () => {
      const a = ClerkOrganizationId.from("org_abc");
      const b = ClerkOrganizationId.from("org_abc");
      expect(a.equals(b)).toBe(true);
    });

    it("異なる value の ClerkOrganizationId は等値でない", () => {
      const a = ClerkOrganizationId.from("org_aaa");
      const b = ClerkOrganizationId.from("org_bbb");
      expect(a.equals(b)).toBe(false);
    });

    it("自身と比較した場合は等値である", () => {
      const id = ClerkOrganizationId.from("org_self");
      expect(id.equals(id)).toBe(true);
    });
  });
});
