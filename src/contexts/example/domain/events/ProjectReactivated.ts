import { DomainEvent } from "./DomainEvent";
import type { ProjectId } from "../valueObjects/ProjectId";

export class ProjectReactivated extends DomainEvent {
  constructor(readonly projectId: ProjectId) {
    super();
  }

  get eventName(): string {
    return "ProjectReactivated";
  }
}
