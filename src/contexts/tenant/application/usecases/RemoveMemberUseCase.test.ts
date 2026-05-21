import { describe, it, expect, beforeEach } from "vitest";
import { RemoveMemberUseCase } from "./RemoveMemberUseCase";
import { CreateTenantUseCase } from "./CreateTenantUseCase";
import { AddMemberUseCase } from "./AddMemberUseCase";
import { InMemoryTenantRepository } from "./__mocks__/InMemoryTenantRepository";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { TenantNotFoundError } from "../errors/TenantNotFoundError";
import { DomainError } from "../../domain/errors/DomainError";

const VALID_CLERK_ORG_ID = "org_removemember001";
const VALID_NAME = "田中会計事務所";
const INITIAL_OWNER_ID = "user_owner001";
const MEMBER_ID = "user_member001";

describe("RemoveMemberUseCase", () => {
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

    const addUseCase = new AddMemberUseCase(repository, publisher);
    await addUseCase.execute({
      tenantId: existingTenantId,
      userClerkId: MEMBER_ID,
      role: "member",
    });
    publisher.clear();
  });

  describe("正常系: メンバー削除", () => {
    it("member を削除すると memberships から消える", async () => {
      const useCase = new RemoveMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: MEMBER_ID,
      });

      const tenant = await repository.findById(TenantId.from(existingTenantId));
      const found = tenant!.memberships.find((m) => m.userId.value === MEMBER_ID);
      expect(found).toBeUndefined();
    });

    it("MemberRemoved イベントが publish される", async () => {
      const useCase = new RemoveMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: MEMBER_ID,
      });

      const eventNames = publisher.publishedEvents.map((e) => e.eventName);
      expect(eventNames).toContain("MemberRemoved");
    });

    it("削除後に memberships が1件 (初期 owner のみ) になる", async () => {
      const useCase = new RemoveMemberUseCase(repository, publisher);

      await useCase.execute({
        tenantId: existingTenantId,
        userClerkId: MEMBER_ID,
      });

      const tenant = await repository.findById(TenantId.from(existingTenantId));
      expect(tenant!.memberships).toHaveLength(1);
    });
  });

  describe("異常系: Tenant 不在", () => {
    it("存在しない tenantId を渡すと TenantNotFoundError を投げる", async () => {
      const useCase = new RemoveMemberUseCase(repository, publisher);

      await expect(
        useCase.execute({
          tenantId: "00000000-0000-0000-0000-000000000000",
          userClerkId: MEMBER_ID,
        }),
      ).rejects.toThrow(TenantNotFoundError);
    });
  });

  describe("異常系: 最後の owner を削除しようとする", () => {
    it("唯一の owner を削除しようとすると DomainError が伝播する", async () => {
      const useCase = new RemoveMemberUseCase(repository, publisher);

      await expect(
        useCase.execute({
          tenantId: existingTenantId,
          userClerkId: INITIAL_OWNER_ID,
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe("eventPublisher 未注入時", () => {
    it("eventPublisher が undefined でも正常終了する", async () => {
      const useCase = new RemoveMemberUseCase(repository);

      await expect(
        useCase.execute({
          tenantId: existingTenantId,
          userClerkId: MEMBER_ID,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
