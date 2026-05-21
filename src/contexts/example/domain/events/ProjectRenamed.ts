import { DomainEvent } from "./DomainEvent";
import type { ProjectId } from "../valueObjects/ProjectId";
import type { ProjectName } from "../valueObjects/ProjectName";

export class ProjectRenamed extends DomainEvent {
  constructor(
    readonly projectId: ProjectId,
    readonly oldName: ProjectName,
    readonly newName: ProjectName,
  ) {
    super();
  }

  get eventName(): string {
    return "ProjectRenamed";
  }
}
