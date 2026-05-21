import { DomainError } from "../errors/DomainError";

const MAX_LENGTH = 1000;

export class ProjectDescription {
  private constructor(readonly value: string) {}

  static from(value: string): ProjectDescription {
    if (value.length > MAX_LENGTH) {
      throw new DomainError(
        `ProjectDescription exceeds ${MAX_LENGTH} chars: got ${value.length}.`,
      );
    }
    return new ProjectDescription(value);
  }

  static empty(): ProjectDescription {
    return new ProjectDescription("");
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }

  equals(other: ProjectDescription): boolean {
    return this.value === other.value;
  }
}
