import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { TenantId } from "./TenantId";

describe("TenantId (example context)", () => {
  it("UUID 形式から生成できる", () => {
    const id = TenantId.from("550e8400-e29b-41d4-a716-446655440000");
    expect(id.value).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("UUID でない値は DomainError", () => {
    expect(() => TenantId.from("not-a-uuid")).toThrow(DomainError);
    expect(() => TenantId.from("")).toThrow(DomainError);
  });

  it("equals() で値比較できる", () => {
    const a = TenantId.from("550e8400-e29b-41d4-a716-446655440000");
    const b = TenantId.from("550e8400-e29b-41d4-a716-446655440000");
    expect(a.equals(b)).toBe(true);
  });
});
