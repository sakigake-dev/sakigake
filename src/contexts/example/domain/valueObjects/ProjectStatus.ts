import { DomainError } from "../errors/DomainError";

type ProjectStatusValue = "active" | "archived";

export class ProjectStatus {
  private constructor(readonly value: ProjectStatusValue) {}

  static active(): ProjectStatus {
    return new ProjectStatus("active");
  }

  static archived(): ProjectStatus {
    return new ProjectStatus("archived");
  }

  static from(value: string): ProjectStatus {
    if (value !== "active" && value !== "archived") {
      throw new DomainError(
        `Invalid ProjectStatus: '${value}'. Must be 'active' or 'archived'.`,
      );
    }
    return new ProjectStatus(value);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isArchived(): boolean {
    return this.value === "archived";
  }

  equals(other: ProjectStatus): boolean {
    return this.value === other.value;
  }
}
