import { DomainEvent } from "./DomainEvent";
import type { ProjectId } from "../valueObjects/ProjectId";
import type { ProjectName } from "../valueObjects/ProjectName";
import type { TenantId } from "../valueObjects/TenantId";
import type { UserId } from "../valueObjects/UserId";

export class ProjectCreated extends DomainEvent {
  constructor(
    readonly projectId: ProjectId,
    readonly tenantId: TenantId,
    readonly name: ProjectName,
    readonly ownerId: UserId,
  ) {
    super();
  }

  get eventName(): string {
    return "ProjectCreated";
  }
}
