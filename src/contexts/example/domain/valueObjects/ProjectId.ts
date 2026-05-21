import { DomainError } from "../errors/DomainError";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ProjectId {
  private constructor(readonly value: string) {}

  static from(value: string): ProjectId {
    if (!UUID_REGEX.test(value)) {
      throw new DomainError(
        `Invalid ProjectId: '${value}'. Must be a valid UUID.`,
      );
    }
    return new ProjectId(value);
  }

  static generate(): ProjectId {
    return new ProjectId(crypto.randomUUID());
  }

  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }
}
