import { describe, it, expect, beforeEach } from "vitest";
import { CreateTenantUseCase } from "./CreateTenantUseCase";
import { InMemoryTenantRepository } from "./__mocks__/InMemoryTenantRepository";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { DomainError } from "../../domain/errors/DomainError";

const VALID_CLERK_ORG_ID = "org_abc123";
const VALID_NAME = "山田会計事務所";
const VALID_OWNER_USER_ID = "user_owner001";

function makeInput(overrides?: Partial<{ clerkOrganizationId: string; name: string; initialOwnerClerkUserId: string }>) {
  return {
    clerkOrganizationId: VALID_CLERK_ORG_ID,
    name: VALID_NAME,
    initialOwnerClerkUserId: VALID_OWNER_USER_ID,
    ...overrides,
  };
}

describe("CreateTenantUseCase", () => {
  let repository: InMemoryTenantRepository;
  let publisher: InMemoryEventPublisher;

  beforeEach(() => {
    repository = new InMemoryTenantRepository();
    publisher = new InMemoryEventPublisher();
  });

  describe("正常系: 新規テナント作成", () => {
    it("新規テナントが保存され tenantId (UUID) を返す", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      const output = await useCase.execute(makeInput());

      expect(typeof output.tenantId).toBe("string");
      expect(output.tenantId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(repository.size()).toBe(1);
    });

    it("save が呼ばれ、初期 owner membership が付与されている", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      const output = await useCase.execute(makeInput());

      const saved = await repository.findById(TenantId.from(output.tenantId));
      expect(saved).not.toBeNull();
      expect(saved!.memberships).toHaveLength(1);
      expect(saved!.memberships[0].role.isOwner()).toBe(true);
      expect(saved!.memberships[0].userId.value).toBe(VALID_OWNER_USER_ID);
    });

    it("Domain Events (TenantCreated, MemberAdded) が publish される", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await useCase.execute(makeInput());

      const eventNames = publisher.publishedEvents.map((e) => e.eventName);
      expect(eventNames).toContain("TenantCreated");
      expect(eventNames).toContain("MemberAdded");
    });
  });

  describe("冪等性: 既存テナントが見つかる場合", () => {
    it("同じ clerkOrganizationId で再度実行すると既存の tenantId を返す", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      const first = await useCase.execute(makeInput());
      const second = await useCase.execute(makeInput());

      expect(second.tenantId).toBe(first.tenantId);
    });

    it("既存テナントが存在する場合は save が呼ばれない (repository に新規追加されない)", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await useCase.execute(makeInput());
      const sizeAfterFirst = repository.size();

      await useCase.execute(makeInput());
      expect(repository.size()).toBe(sizeAfterFirst);
    });

    it("既存テナントが存在する場合は events が publish されない", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await useCase.execute(makeInput());
      publisher.clear();

      await useCase.execute(makeInput());
      expect(publisher.publishedEvents).toHaveLength(0);
    });
  });

  describe("バリデーション: 不正な入力は VO 層で DomainError", () => {
    it("'org_' prefix のない clerkOrganizationId は DomainError を投げる", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await expect(
        useCase.execute(makeInput({ clerkOrganizationId: "invalid_org_id" })),
      ).rejects.toThrow(DomainError);
    });

    it("空の name は DomainError を投げる", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await expect(
        useCase.execute(makeInput({ name: "" })),
      ).rejects.toThrow(DomainError);
    });

    it("空白のみの name は DomainError を投げる", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await expect(
        useCase.execute(makeInput({ name: "   " })),
      ).rejects.toThrow(DomainError);
    });

    it("'user_' prefix のない initialOwnerClerkUserId は DomainError を投げる", async () => {
      const useCase = new CreateTenantUseCase(repository, publisher);

      await expect(
        useCase.execute(makeInput({ initialOwnerClerkUserId: "no_prefix_id" })),
      ).rejects.toThrow(DomainError);
    });
  });

  describe("eventPublisher 未注入時", () => {
    it("eventPublisher が undefined でも例外を投げずに正常終了する", async () => {
      const useCase = new CreateTenantUseCase(repository);

      await expect(useCase.execute(makeInput())).resolves.toBeDefined();
      expect(repository.size()).toBe(1);
    });
  });
});
