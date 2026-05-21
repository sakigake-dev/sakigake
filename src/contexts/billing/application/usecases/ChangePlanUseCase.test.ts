import { describe, it, expect } from "vitest";
import { ChangePlanUseCase } from "./ChangePlanUseCase";
import { InMemorySubscriptionRepository } from "./__mocks__/InMemorySubscriptionRepository";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { Subscription } from "../../domain/models/Subscription";
import { SubscriptionStatus } from "../../domain/valueObjects/SubscriptionStatus";
import { SubscriptionId } from "../../domain/valueObjects/SubscriptionId";
import { Plan } from "../../domain/valueObjects/Plan";
import { SubscriptionNotFoundError } from "../errors/SubscriptionNotFoundError";
import { DomainError } from "../../domain/errors/DomainError";
import { PlanChanged } from "../../domain/events/PlanChanged";

const TENANT_ID_STR = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

async function createAndSaveFreeSubscription(
  repo: InMemorySubscriptionRepository,
): Promise<Subscription> {
  const sub = Subscription.createFree(TenantId.from(TENANT_ID_STR));
  sub.pullDomainEvents();
  await repo.save(sub);
  return sub;
}

describe("ChangePlanUseCase", () => {
  describe("正常系", () => {
    it("free → starter に変更できる", async () => {
      const repo = new InMemorySubscriptionRepository();
      await createAndSaveFreeSubscription(repo);
      const useCase = new ChangePlanUseCase(repo);

      const result = await useCase.execute({
        tenantId: TENANT_ID_STR,
        newPlanValue: "starter",
      });

      expect(result.subscriptionId).toBeDefined();

      const updated = await repo.findByTenantId(TenantId.from(TENANT_ID_STR));
      expect(updated!.plan.value).toBe("starter");
    });

    it("starter → professional に変更できる", async () => {
      const repo = new InMemorySubscriptionRepository();
      const sub = Subscription.reconstruct(
        SubscriptionId.generate(),
        TenantId.from(TENANT_ID_STR),
        Plan.starter(),
        SubscriptionStatus.active(),
        null,
      );
      await repo.save(sub);

      const useCase = new ChangePlanUseCase(repo);

      await useCase.execute({
        tenantId: TENANT_ID_STR,
        newPlanValue: "professional",
      });

      const updated = await repo.findByTenantId(TenantId.from(TENANT_ID_STR));
      expect(updated!.plan.value).toBe("professional");
    });

    it("PlanChanged イベントが EventPublisher に発行される", async () => {
      const repo = new InMemorySubscriptionRepository();
      await createAndSaveFreeSubscription(repo);
      const publisher = new InMemoryEventPublisher();
      const useCase = new ChangePlanUseCase(repo, publisher);

      await useCase.execute({
        tenantId: TENANT_ID_STR,
        newPlanValue: "starter",
      });

      expect(publisher.publishedEvents).toHaveLength(1);
      expect(publisher.publishedEvents[0]).toBeInstanceOf(PlanChanged);
      const event = publisher.publishedEvents[0] as PlanChanged;
      expect(event.oldPlan.value).toBe("free");
      expect(event.newPlan.value).toBe("starter");
    });

    it("EventPublisher が未注入でも正常に動作する", async () => {
      const repo = new InMemorySubscriptionRepository();
      await createAndSaveFreeSubscription(repo);
      const useCase = new ChangePlanUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR, newPlanValue: "starter" }),
      ).resolves.toBeDefined();
    });
  });

  describe("Subscription が存在しない場合", () => {
    it("SubscriptionNotFoundError を投げる", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new ChangePlanUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR, newPlanValue: "starter" }),
      ).rejects.toThrow(SubscriptionNotFoundError);
    });

    it("エラーメッセージに tenantId が含まれる", async () => {
      const repo = new InMemorySubscriptionRepository();
      const useCase = new ChangePlanUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR, newPlanValue: "starter" }),
      ).rejects.toThrow(TENANT_ID_STR);
    });
  });

  describe("canceled な Subscription への変更 (DomainError 伝播)", () => {
    it("DomainError を透過的に伝播する", async () => {
      const repo = new InMemorySubscriptionRepository();
      const canceledSub = Subscription.reconstruct(
        SubscriptionId.generate(),
        TenantId.from(TENANT_ID_STR),
        Plan.free(),
        SubscriptionStatus.canceled(),
        null,
      );
      await repo.save(canceledSub);

      const useCase = new ChangePlanUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR, newPlanValue: "starter" }),
      ).rejects.toThrow(DomainError);
    });

    it("canceled Subscription へのプラン変更のエラーメッセージが正しい", async () => {
      const repo = new InMemorySubscriptionRepository();
      const canceledSub = Subscription.reconstruct(
        SubscriptionId.generate(),
        TenantId.from(TENANT_ID_STR),
        Plan.free(),
        SubscriptionStatus.canceled(),
        null,
      );
      await repo.save(canceledSub);

      const useCase = new ChangePlanUseCase(repo);

      await expect(
        useCase.execute({ tenantId: TENANT_ID_STR, newPlanValue: "starter" }),
      ).rejects.toThrow("Cannot upgrade a canceled subscription");
    });
  });
});
