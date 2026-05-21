import { DomainError } from "../errors/DomainError";

const MIN_LENGTH = 1;
const MAX_LENGTH = 100;

export class ProjectName {
  private constructor(readonly value: string) {}

  static from(value: string): ProjectName {
    const trimmed = value.trim();
    if (trimmed.length < MIN_LENGTH) {
      throw new DomainError(`ProjectName cannot be empty.`);
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new DomainError(
        `ProjectName exceeds ${MAX_LENGTH} chars: got ${trimmed.length}.`,
      );
    }
    return new ProjectName(trimmed);
  }

  equals(other: ProjectName): boolean {
    return this.value === other.value;
  }
}
