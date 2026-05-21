import { describe, it, expect } from "vitest";
import { Tenant } from "./Tenant";
import { TenantName } from "../valueObjects/TenantName";
import { ClerkOrganizationId } from "../valueObjects/ClerkOrganizationId";
import { UserId } from "../valueObjects/UserId";
import { MemberRole } from "../valueObjects/MemberRole";
import { TenantStatus } from "../valueObjects/TenantStatus";
import { TenantMembership } from "./TenantMembership";
import { DomainError } from "../errors/DomainError";
import type { TenantCreated } from "../events/TenantCreated";
import type { MemberAdded } from "../events/MemberAdded";
import type { MemberRemoved } from "../events/MemberRemoved";
import type { MemberRoleChanged } from "../events/MemberRoleChanged";
import type { TenantSuspended } from "../events/TenantSuspended";
import type { TenantReactivated } from "../events/TenantReactivated";

function makeTenant(): Tenant {
  return Tenant.create(
    TenantName.from("山田会計事務所"),
    ClerkOrganizationId.from("org_abc123"),
  );
}

describe("Tenant", () => {
  describe("create()", () => {
    it("create() で TenantCreated イベントが pullDomainEvents() で取得できる", () => {
      const tenant = makeTenant();
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe("TenantCreated");
    });

    it("TenantCreated イベントは正しい tenantId / name / clerkOrganizationId を持つ", () => {
      const name = TenantName.from("山田会計事務所");
      const clerkOrgId = ClerkOrganizationId.from("org_abc123");
      const tenant = Tenant.create(name, clerkOrgId);
      const events = tenant.pullDomainEvents();
      const event = events[0] as TenantCreated;
      expect(event.name.equals(name)).toBe(true);
      expect(event.clerkOrganizationId.equals(clerkOrgId)).toBe(true);
    });

    it("生成直後の status は active である", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents();
      expect(tenant.status.isActive()).toBe(true);
    });

    it("生成直後の memberships は空である", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents();
      expect(tenant.memberships).toHaveLength(0);
    });
  });

  describe("addMember()", () => {
    it("addMember() で MemberAdded イベントが pullDomainEvents() に含まれる", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents(); // create イベントをクリア
      const userId = UserId.from("user_xyz");
      tenant.addMember(userId, MemberRole.member());
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe("MemberAdded");
    });

    it("MemberAdded イベントは正しい userId と role を持つ", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents();
      const userId = UserId.from("user_xyz");
      const role = MemberRole.owner();
      tenant.addMember(userId, role);
      const events = tenant.pullDomainEvents();
      const event = events[0] as MemberAdded;
      expect(event.userId.equals(userId)).toBe(true);
      expect(event.role.equals(role)).toBe(true);
    });

    it("同じ userId を同じ role で2回追加すると DomainError を投げる", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_xyz");
      tenant.addMember(userId, MemberRole.member());
      expect(() => tenant.addMember(userId, MemberRole.member())).toThrow(
        DomainError,
      );
    });

    it("同じ userId を異なる role で2回追加しても DomainError を投げる (重複禁止)", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_xyz");
      tenant.addMember(userId, MemberRole.member());
      expect(() => tenant.addMember(userId, MemberRole.owner())).toThrow(
        DomainError,
      );
    });

    it("追加したメンバーが memberships に反映される", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_xyz");
      tenant.addMember(userId, MemberRole.member());
      expect(tenant.memberships).toHaveLength(1);
      expect(tenant.memberships[0].userId.equals(userId)).toBe(true);
    });
  });

  describe("removeMember()", () => {
    it("存在しない userId を removeMember() すると DomainError を投げる", () => {
      const tenant = makeTenant();
      const unknownId = UserId.from("user_unknown");
      expect(() => tenant.removeMember(unknownId)).toThrow(DomainError);
    });

    it("唯一の owner を removeMember() すると DomainError を投げる", () => {
      const tenant = makeTenant();
      const ownerId = UserId.from("user_owner");
      tenant.addMember(ownerId, MemberRole.owner());
      expect(() => tenant.removeMember(ownerId)).toThrow(DomainError);
    });

    it("owner が2人いる場合は1人目の owner を削除できる", () => {
      const tenant = makeTenant();
      const owner1 = UserId.from("user_owner1");
      const owner2 = UserId.from("user_owner2");
      tenant.addMember(owner1, MemberRole.owner());
      tenant.addMember(owner2, MemberRole.owner());
      tenant.pullDomainEvents();
      expect(() => tenant.removeMember(owner1)).not.toThrow();
      expect(tenant.memberships).toHaveLength(1);
    });

    it("member を removeMember() すると成功し MemberRemoved イベントが出る", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_member");
      tenant.addMember(userId, MemberRole.member());
      tenant.pullDomainEvents();
      tenant.removeMember(userId);
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe("MemberRemoved");
    });

    it("MemberRemoved イベントは正しい userId を持つ", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_member");
      tenant.addMember(userId, MemberRole.member());
      tenant.pullDomainEvents();
      tenant.removeMember(userId);
      const events = tenant.pullDomainEvents();
      const event = events[0] as MemberRemoved;
      expect(event.userId.equals(userId)).toBe(true);
    });

    it("removeMember() 後、対象メンバーが memberships から消える", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_member");
      tenant.addMember(userId, MemberRole.member());
      tenant.removeMember(userId);
      expect(tenant.memberships).toHaveLength(0);
    });
  });

  describe("suspend() / reactivate()", () => {
    it("suspend() で status が suspended になる", () => {
      const tenant = makeTenant();
      tenant.suspend();
      expect(tenant.status.equals(TenantStatus.suspended())).toBe(true);
    });

    it("reactivate() で status が active に戻る", () => {
      const tenant = makeTenant();
      tenant.suspend();
      tenant.reactivate();
      expect(tenant.status.equals(TenantStatus.active())).toBe(true);
    });

    it("suspend() で TenantSuspended イベントが発行される", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents();
      tenant.suspend();
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as TenantSuspended;
      expect(event.eventName).toBe("TenantSuspended");
      expect(event.tenantId.equals(tenant.id)).toBe(true);
    });

    it("既に suspended な状態で suspend() を呼んでもイベントが発行されない (no-op)", () => {
      const tenant = makeTenant();
      tenant.suspend();
      tenant.pullDomainEvents();
      tenant.suspend();
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it("reactivate() で TenantReactivated イベントが発行される", () => {
      const tenant = makeTenant();
      tenant.suspend();
      tenant.pullDomainEvents();
      tenant.reactivate();
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as TenantReactivated;
      expect(event.eventName).toBe("TenantReactivated");
      expect(event.tenantId.equals(tenant.id)).toBe(true);
    });

    it("既に active な状態で reactivate() を呼んでもイベントが発行されない (no-op)", () => {
      const tenant = makeTenant();
      tenant.pullDomainEvents();
      tenant.reactivate();
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe("pullDomainEvents()", () => {
    it("pullDomainEvents() を2回呼ぶと2回目は空配列を返す", () => {
      const tenant = makeTenant();
      const first = tenant.pullDomainEvents();
      expect(first).toHaveLength(1); // TenantCreated
      const second = tenant.pullDomainEvents();
      expect(second).toHaveLength(0);
    });

    it("pullDomainEvents() は複数のイベントをまとめて返す", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_xyz");
      tenant.addMember(userId, MemberRole.member());
      const events = tenant.pullDomainEvents();
      // TenantCreated + MemberAdded
      expect(events).toHaveLength(2);
      expect(events[0].eventName).toBe("TenantCreated");
      expect(events[1].eventName).toBe("MemberAdded");
    });
  });

  describe("getters", () => {
    it("id getter は TenantId を返す", () => {
      const tenant = makeTenant();
      expect(tenant.id).toBeDefined();
      expect(typeof tenant.id.value).toBe("string");
    });

    it("name getter は生成時の TenantName を返す", () => {
      const name = TenantName.from("山田会計事務所");
      const tenant = Tenant.create(name, ClerkOrganizationId.from("org_abc"));
      expect(tenant.name.equals(name)).toBe(true);
    });

    it("clerkOrganizationId getter は生成時の ClerkOrganizationId を返す", () => {
      const clerkOrgId = ClerkOrganizationId.from("org_abc");
      const tenant = Tenant.create(TenantName.from("テスト事務所"), clerkOrgId);
      expect(tenant.clerkOrganizationId.equals(clerkOrgId)).toBe(true);
    });

    it("memberships getter の defensive copy: 取得した配列に push しても Aggregate 本体に影響しない", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_before");
      tenant.addMember(userId, MemberRole.owner());
      const before = tenant.memberships;
      const lengthBefore = before.length;
      const dummy = new TenantMembership(
        UserId.from("user_dummy"),
        MemberRole.member(),
      );
      (before as TenantMembership[]).push(dummy);
      expect(tenant.memberships).toHaveLength(lengthBefore);
    });
  });

  describe("reconstruct()", () => {
    it("reconstruct で重複 userId が含まれる場合 DomainError を投げる", () => {
      const id = Tenant.create(TenantName.from("x"), ClerkOrganizationId.from("org_x")).id;
      const ownerId = UserId.from("user_owner1");
      const duplicatedMemberships = [
        new TenantMembership(ownerId, MemberRole.owner()),
        new TenantMembership(ownerId, MemberRole.member()),
      ];
      expect(() =>
        Tenant.reconstruct(
          id,
          TenantName.from("テスト"),
          ClerkOrganizationId.from("org_abc"),
          TenantStatus.active(),
          duplicatedMemberships,
        ),
      ).toThrow(DomainError);
    });

    it("reconstruct で memberships が非空かつ owner 不在の場合 DomainError を投げる", () => {
      const id = Tenant.create(TenantName.from("x"), ClerkOrganizationId.from("org_x")).id;
      const noOwnerMemberships = [
        new TenantMembership(UserId.from("user_member1"), MemberRole.member()),
      ];
      expect(() =>
        Tenant.reconstruct(
          id,
          TenantName.from("テスト"),
          ClerkOrganizationId.from("org_abc"),
          TenantStatus.active(),
          noOwnerMemberships,
        ),
      ).toThrow(DomainError);
    });

    it("reconstruct で memberships が空の場合は owner 不在でもエラーにならない", () => {
      const id = Tenant.create(TenantName.from("x"), ClerkOrganizationId.from("org_x")).id;
      expect(() =>
        Tenant.reconstruct(
          id,
          TenantName.from("テスト"),
          ClerkOrganizationId.from("org_abc"),
          TenantStatus.active(),
          [],
        ),
      ).not.toThrow();
    });
  });

  describe("changeMemberRole()", () => {
    it("存在しない userId を changeMemberRole() すると DomainError を投げる", () => {
      const tenant = makeTenant();
      const unknownId = UserId.from("user_unknown");
      expect(() =>
        tenant.changeMemberRole(unknownId, MemberRole.member()),
      ).toThrow(DomainError);
    });

    it("唯一の owner を owner 以外のロールに降格しようとすると DomainError を投げる", () => {
      const tenant = makeTenant();
      const ownerId = UserId.from("user_owner");
      tenant.addMember(ownerId, MemberRole.owner());
      expect(() =>
        tenant.changeMemberRole(ownerId, MemberRole.member()),
      ).toThrow(DomainError);
    });

    it("owner が2人いる場合は1人の owner を member に降格できる", () => {
      const tenant = makeTenant();
      const owner1 = UserId.from("user_owner1");
      const owner2 = UserId.from("user_owner2");
      tenant.addMember(owner1, MemberRole.owner());
      tenant.addMember(owner2, MemberRole.owner());
      tenant.pullDomainEvents();
      expect(() =>
        tenant.changeMemberRole(owner1, MemberRole.member()),
      ).not.toThrow();
      const m = tenant.memberships.find((m) => m.userId.equals(owner1));
      expect(m?.role.equals(MemberRole.member())).toBe(true);
    });

    it("同じロールで changeMemberRole() を呼んでも no-op でイベントが出ない", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_member");
      tenant.addMember(userId, MemberRole.member());
      tenant.pullDomainEvents();
      tenant.changeMemberRole(userId, MemberRole.member());
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(0);
    });

    it("ロール変更成功で MemberRoleChanged イベントが発行される", () => {
      const tenant = makeTenant();
      const userId = UserId.from("user_member");
      tenant.addMember(userId, MemberRole.member());
      tenant.pullDomainEvents();
      tenant.changeMemberRole(userId, MemberRole.admin());
      const events = tenant.pullDomainEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as MemberRoleChanged;
      expect(event.eventName).toBe("MemberRoleChanged");
      expect(event.userId.equals(userId)).toBe(true);
      expect(event.oldRole.equals(MemberRole.member())).toBe(true);
      expect(event.newRole.equals(MemberRole.admin())).toBe(true);
    });
  });
});
