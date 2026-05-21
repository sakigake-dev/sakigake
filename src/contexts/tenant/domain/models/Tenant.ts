import { TenantId } from "../valueObjects/TenantId";
import type { TenantName } from "../valueObjects/TenantName";
import type { ClerkOrganizationId } from "../valueObjects/ClerkOrganizationId";
import type { UserId } from "../valueObjects/UserId";
import type { MemberRole } from "../valueObjects/MemberRole";
import { TenantStatus } from "../valueObjects/TenantStatus";
import { TenantMembership } from "./TenantMembership";
import { DomainError } from "../errors/DomainError";
import type { DomainEvent } from "../events/DomainEvent";
import { TenantCreated } from "../events/TenantCreated";
import { MemberAdded } from "../events/MemberAdded";
import { MemberRemoved } from "../events/MemberRemoved";
import { MemberRoleChanged } from "../events/MemberRoleChanged";
import { TenantSuspended } from "../events/TenantSuspended";
import { TenantReactivated } from "../events/TenantReactivated";

export class Tenant {
  private readonly _id: TenantId;
  private _name: TenantName;
  private _status: TenantStatus;
  private _memberships: TenantMembership[];
  private readonly _clerkOrganizationId: ClerkOrganizationId;
  private _domainEvents: DomainEvent[];

  private constructor(
    id: TenantId,
    name: TenantName,
    clerkOrganizationId: ClerkOrganizationId,
    status: TenantStatus,
    memberships: TenantMembership[],
    domainEvents: DomainEvent[],
  ) {
    this._id = id;
    this._name = name;
    this._clerkOrganizationId = clerkOrganizationId;
    this._status = status;
    this._memberships = memberships;
    this._domainEvents = domainEvents;
  }

  static create(name: TenantName, clerkOrgId: ClerkOrganizationId): Tenant {
    const id = TenantId.generate();
    const tenant = new Tenant(
      id,
      name,
      clerkOrgId,
      TenantStatus.active(),
      [],
      [],
    );
    tenant._domainEvents.push(new TenantCreated(id, name, clerkOrgId));
    return tenant;
  }

  static reconstruct(
    id: TenantId,
    name: TenantName,
    clerkOrganizationId: ClerkOrganizationId,
    status: TenantStatus,
    memberships: TenantMembership[],
  ): Tenant {
    Tenant.assertInvariants(memberships);
    return new Tenant(id, name, clerkOrganizationId, status, memberships, []);
  }

  get id(): TenantId {
    return this._id;
  }

  get name(): TenantName {
    return this._name;
  }

  get clerkOrganizationId(): ClerkOrganizationId {
    return this._clerkOrganizationId;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get memberships(): readonly TenantMembership[] {
    return [...this._memberships];
  }

  addMember(userId: UserId, role: MemberRole): void {
    const nextMemberships = [...this._memberships, new TenantMembership(userId, role)];
    Tenant.assertNoDuplicateUserIds(nextMemberships);
    this._memberships.push(new TenantMembership(userId, role));
    this._domainEvents.push(new MemberAdded(this._id, userId, role));
  }

  removeMember(userId: UserId): void {
    const target = this._memberships.find((m) => m.userId.equals(userId));
    if (!target) {
      throw new DomainError("Member not found");
    }
    if (target.role.isOwner() && this.ownerCount() === 1) {
      throw new DomainError("Cannot remove the last owner");
    }
    this._memberships = this._memberships.filter(
      (m) => !m.userId.equals(userId),
    );
    this._domainEvents.push(new MemberRemoved(this._id, userId));
  }

  changeMemberRole(userId: UserId, newRole: MemberRole): void {
    const target = this._memberships.find((m) => m.userId.equals(userId));
    if (!target) {
      throw new DomainError("Member not found");
    }
    if (target.role.equals(newRole)) {
      return;
    }
    if (target.role.isOwner() && this.ownerCount() === 1 && !newRole.isOwner()) {
      throw new DomainError("Cannot demote the last owner");
    }
    const oldRole = target.role;
    target._changeRole(newRole);
    this._domainEvents.push(
      new MemberRoleChanged(this._id, userId, oldRole, newRole),
    );
  }

  suspend(): void {
    if (this._status.isSuspended()) {
      return;
    }
    this._status = TenantStatus.suspended();
    this._domainEvents.push(new TenantSuspended(this._id));
  }

  reactivate(): void {
    if (this._status.isActive()) {
      return;
    }
    this._status = TenantStatus.active();
    this._domainEvents.push(new TenantReactivated(this._id));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  private static assertInvariants(memberships: TenantMembership[]): void {
    Tenant.assertNoDuplicateUserIds(memberships);
    if (memberships.length > 0) {
      const ownerCount = memberships.filter((m) => m.role.isOwner()).length;
      if (ownerCount === 0) {
        throw new DomainError(
          "A tenant with members must have at least one owner",
        );
      }
    }
  }

  private static assertNoDuplicateUserIds(memberships: TenantMembership[]): void {
    const userIds = memberships.map((m) => m.userId.value);
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new DomainError("Duplicate userId detected in memberships");
    }
  }

  private ownerCount(): number {
    return this._memberships.filter((m) => m.role.isOwner()).length;
  }
}
