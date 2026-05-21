import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/DomainError";
import { UserId } from "./UserId";

describe("UserId (example context)", () => {
  it("Clerk user ID 形式から生成できる", () => {
    const id = UserId.from("user_2abcDEF123");
    expect(id.value).toBe("user_2abcDEF123");
  });

  it("user_ プレフィックスがない値は DomainError", () => {
    expect(() => UserId.from("2abcDEF123")).toThrow(DomainError);
    expect(() => UserId.from("")).toThrow(DomainError);
  });

  it("equals() で値比較できる", () => {
    const a = UserId.from("user_001");
    const b = UserId.from("user_001");
    expect(a.equals(b)).toBe(true);
  });
});
