import { DomainError } from "../errors/DomainError";

// バリデーション方針: 前後の空白をトリムした長さで 1〜100 文字を検証する。
// 保持する値はトリム後の文字列とする。
// 根拠: 事務所名として意味を持つのはトリム後の文字列であり、
//       前後の空白を保持しても業務的価値がない。
const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class TenantName {
  private constructor(readonly value: string) {}

  static from(raw: string): TenantName {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_LENGTH) {
      throw new DomainError("TenantName cannot be empty");
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new DomainError(
        `TenantName must be ${MAX_LENGTH} characters or fewer`,
      );
    }
    return new TenantName(trimmed);
  }

  equals(other: TenantName): boolean {
    return this.value === other.value;
  }
}
