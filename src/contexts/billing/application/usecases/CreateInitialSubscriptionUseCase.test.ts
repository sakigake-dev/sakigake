import { describe, it, expect } from "vitest";
import { CreateInitialSubscriptionUseCase } from "./CreateInitialSubscriptionUseCase";
import { InMemorySubscriptionRepository } from "./__mocks__/InMemorySubscriptionRepository";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { Subscription } from "../../domain/models/Subscription";
import { SubscriptionCreated } from "../../domain/events/SubscriptionCreated";

const TENANT_ID_STR = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("CreateInitialSubscriptionUseCase", () => {
  describe("正常系", () => {
    it("free plan の Subscription を作成して subscriptionId を返す", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      const result = await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(result.subscriptionId).toBeDefined();
      expect(typeof result.subscriptionId).toBe("string");
      expect(result.subscriptionId.length).toBeGreaterThan(0);
    });

    it("作成された Subscription が Repository に保存される", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      await useCase.execute({ tenantId: TENANT_ID_STR });

      const saved = await repo.findByTenantId(TenantId.from(TENANT_ID_STR));
      expect(saved).not.toBeNull();
      expect(saved!.plan.value).toBe("free");
      expect(saved!.status.isActive()).toBe(true);
    });

    it("ドメインイベントが EventPublisher に発行される", async () => {
      const repo = new InMemorySubscriptionRepository();
      const publisher = new InMemoryEventPublisher();
      const useCase = new CreateInitialSubscriptionUseCase(repo, publisher);

      await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(publisher.publishedEvents).toHaveLength(1);
      expect(publisher.publishedEvents[0]).toBeInstanceOf(SubscriptionCreated);
    });

    it("EventPublisher が未注入でも正常に動作する", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR }),
      ).resolves.toBeDefined();
    });
  });

  describe("冪等性 (Webhook 重複送信対策)", () => {
    it("同じ tenantId で2回実行すると既存の subscriptionId を返す", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      const first = await useCase.execute({ tenantId: TENANT_ID_STR });
      const second = await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(first.subscriptionId).toBe(second.subscriptionId);
    });

    it("同じ tenantId で2回実行しても Repository に1件しか保存されない", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      await useCase.execute({ tenantId: TENANT_ID_STR });
      await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(repo.size()).toBe(1);
    });

    it("2回目の実行時は EventPublisher にイベントが発行されない", async () => {
      const repo = new InMemorySubscriptionRepository();
      const publisher = new InMemoryEventPublisher();
      const useCase = new CreateInitialSubscriptionUseCase(repo, publisher);

      await useCase.execute({ tenantId: TENANT_ID_STR });
      publisher.clear();

      await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(publisher.publishedEvents).toHaveLength(0);
    });
  });

  describe("異なるテナントに対して個別に Subscription が作成される", () => {
    it("2テナントが独立した Subscription を持つ", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new CreateInitialSubscriptionUseCase(repo);

      const tenantA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
      const tenantB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

      const resultA = await useCase.execute({ tenantId: tenantA });
      const resultB = await useCase.execute({ tenantId: tenantB });

      expect(resultA.subscriptionId).not.toBe(resultB.subscriptionId);
      expect(repo.size()).toBe(2);
    });
  });

  describe("既存の Subscription が plan=starter でも 冪等に動作する", () => {
    it("既存 Subscription があれば新規作成せずにそのまま返す", async () => {
      const repo = new InMemorySubscriptionRepository();
      const existingSub = Subscription.createFree(TenantId.from(TENANT_ID_STR));
      existingSub.upgradePlan(
        (await import("../../domain/valueObjects/Plan")).Plan.starter(),
      );
      await repo.save(existingSub);
      existingSub.pullDomainEvents();

      const useCase = new CreateInitialSubscriptionUseCase(repo);
      const result = await useCase.execute({ tenantId: TENANT_ID_STR });

      expect(result.subscriptionId).toBe(existingSub.id.value);
      expect(repo.size()).toBe(1);
    });
  });
});
