import type { DomainEvent } from "./DomainEvent";
import type { TenantId } from "../valueObjects/TenantId";
import type { TenantName } from "../valueObjects/TenantName";
import type { ClerkOrganizationId } from "../valueObjects/ClerkOrganizationId";

export class TenantCreated implements DomainEvent {
  readonly eventName = "TenantCreated";
  readonly occurredAt: Date;

  constructor(
    readonly tenantId: TenantId,
    readonly name: TenantName,
    readonly clerkOrganizationId: ClerkOrganizationId,
    occurredAt: Date = new Date(),
  ) {
    this.occurredAt = occurredAt;
  }
}
