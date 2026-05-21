import { describe, it, expect, beforeEach } from "vitest";
import { AddMemberUseCase } from "./AddMemberUseCase";
import { CreateTenantUseCase } from "./CreateTenantUseCase";
import { InMemoryTenantRepository } from "./__mocks__/InMemoryTenantRepository";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { TenantNotFoundError } from "../errors/TenantNotFoundError";
import { DomainError } from "../../domain/errors/DomainError";

const VALID_CLERK_ORG_ID = "org_addmember001";
const VALID_NAME = "佐藤税務事務所";
const INITIAL_OWNER_ID = "user_owner001";

describe("AddMemberUseCase", () => {
  let repository: InMemoryTenantRepository;
  let publisher: InMemoryEventPublisher;
  let existingTenantId: string;

  beforeEach(async () => {
    repository = new InMemoryTenantRepository();
    publisher = new InMemoryEventPublisher();

    const createUseCase = new CreateTenantUseCase(repository, publisher);
    const result = await createUseCase.execute({
      clerkOrganizationId: VALID_CLERK_ORG_ID,
      name: VALID_NAME,
      initialOwnerClerkUserId: INITIAL_OWNER_ID,
    });
    existingTenantId = result.tenantId;
    publisher.clear();
  });

  describe("正常系: メンバー追加", () => {
    it("member ロールのメンバーを追加すると memberships が増える", async () => {
      const useCase = new AddMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: "user_newmember001",
        role: "member",
      });

      const tenant = await repository.findById(TenantId.from(existingTenantId));
      expect(tenant!.memberships).toHaveLength(2);
    });

    it("追加されたメンバーの role が正しく反映されている", async () => {
      const useCase = new AddMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: "user_newadmin001",
        role: "admin",
      });

      const tenant = await repository.findById(TenantId.from(existingTenantId));
      const added = tenant!.memberships.find(
        (m) => m.userId.value === "user_newadmin001",
      );
      expect(added).toBeDefined();
      expect(added!.role.value).toBe("admin");
    });

    it("MemberAdded イベントが publish される", async () => {
      const useCase = new AddMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: "user_newmember002",
        role: "member",
      });

      const eventNames = publisher.publishedEvents.map((e) => e.eventName);
      expect(eventNames).toContain("MemberAdded");
    });
  });

  describe("異常系: Tenant 不在", () => {
    it("存在しない tenantId を渡すと TenantNotFoundError を投げる", async () => {
      const useCase = new AddMemberUseCase(repository, publisher);

      await expect(
        useCase.execute({
          tenantId: "00000000-0000-0000-0000-000000000000",
          userClerkId: "user_someone001",
          role: "member",
        }),
      ).rejects.toThrow(TenantNotFoundError);
    });
  });

  describe("異常系: 重複メンバー", () => {
    it("既存メンバーと同じ userClerkId を追加すると DomainError が伝播する", async () => {
      const useCase = new AddMemberUseCase(repository, publisher);

      await expect(
        useCase.execute({
          tenantId: existingTenantId,
          userClerkId: INITIAL_OWNER_ID,
          role: "member",
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe("eventPublisher 未注入時", () => {
    it("eventPublisher が undefined でも正常終了する", async () => {
      const useCase = new AddMemberUseCase(repository);

      await expect(
        useCase.execute({
          tenantId: existingTenantId,
          userClerkId: "user_nopub001",
          role: "member",
        }),
      ).resolves.toBeUndefined();
    });
  });
});
