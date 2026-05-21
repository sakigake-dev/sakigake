import { describe, it, expect } from "vitest";
import { Subscription } from "./Subscription";
import { TenantId } from "../valueObjects/TenantId";
import { SubscriptionId } from "../valueObjects/SubscriptionId";
import { Plan } from "../valueObjects/Plan";
import { SubscriptionStatus } from "../valueObjects/SubscriptionStatus";
import { DomainError } from "../errors/DomainError";
import { SubscriptionCreated } from "../events/SubscriptionCreated";
import { PlanChanged } from "../events/PlanChanged";
import { SubscriptionCanceled } from "../events/SubscriptionCanceled";

const TEST_TENANT_ID = TenantId.from("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
const TEST_SUBSCRIPTION_ID = SubscriptionId.from(
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
);

describe("Subscription", () => {
  describe("createFree()", () => {
    it("plan=free, status=active で Subscription を生成する", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);

      expect(sub.plan.value).toBe("free");
      expect(sub.status.value).toBe("active");
      expect(sub.tenantId.equals(TEST_TENANT_ID)).toBe(true);
      expect(sub.stripeSubscriptionId).toBeNull();
    });

    it("SubscriptionCreated ドメインイベントを発行する", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      const events = sub.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionCreated);
      const event = events[0] as SubscriptionCreated;
      expect(event.eventName).toBe("SubscriptionCreated");
      expect(event.tenantId.equals(TEST_TENANT_ID)).toBe(true);
      expect(event.plan.value).toBe("free");
    });

    it("pullDomainEvents() 後は events が空になる (consume-once)", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();
      expect(sub.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("reconstruct()", () => {
    it("Repository からの復元時はドメインイベントを発行しない", () => {
      const sub = Subscription.reconstruct(
        TEST_SUBSCRIPTION_ID,
        TEST_TENANT_ID,
        Plan.starter(),
        SubscriptionStatus.active(),
        null,
      );

      expect(sub.pullDomainEvents()).toHaveLength(0);
    });

    it("渡した値がそのまま getter に反映される", () => {
      const sub = Subscription.reconstruct(
        TEST_SUBSCRIPTION_ID,
        TEST_TENANT_ID,
        Plan.professional(),
        SubscriptionStatus.suspended(),
        "sub_stripe_123",
      );

      expect(sub.id.equals(TEST_SUBSCRIPTION_ID)).toBe(true);
      expect(sub.tenantId.equals(TEST_TENANT_ID)).toBe(true);
      expect(sub.plan.value).toBe("professional");
      expect(sub.status.value).toBe("suspended");
      expect(sub.stripeSubscriptionId).toBe("sub_stripe_123");
    });
  });

  describe("upgradePlan()", () => {
    it("active な Subscription のプランを変更できる", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();

      sub.upgradePlan(Plan.starter());

      expect(sub.plan.value).toBe("starter");
    });

    it("PlanChanged ドメインイベントを発行する", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();

      sub.upgradePlan(Plan.starter());

      const events = sub.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PlanChanged);
      const event = events[0] as PlanChanged;
      expect(event.oldPlan.value).toBe("free");
      expect(event.newPlan.value).toBe("starter");
    });

    it("canceled な Subscription はプラン変更不可 — DomainError を投げる", () => {
      const sub = Subscription.reconstruct(
        TEST_SUBSCRIPTION_ID,
        TEST_TENANT_ID,
        Plan.free(),
        SubscriptionStatus.canceled(),
        null,
      );

      expect(() => sub.upgradePlan(Plan.starter())).toThrow(DomainError);
      expect(() => sub.upgradePlan(Plan.starter())).toThrow(
        "Cannot upgrade a canceled subscription",
      );
    });

    it("suspended な Subscription はプラン変更できる", () => {
      const sub = Subscription.reconstruct(
        TEST_SUBSCRIPTION_ID,
        TEST_TENANT_ID,
        Plan.free(),
        SubscriptionStatus.suspended(),
        null,
      );

      expect(() => sub.upgradePlan(Plan.starter())).not.toThrow();
      expect(sub.plan.value).toBe("starter");
    });
  });

  describe("cancel()", () => {
    it("active → canceled に遷移する", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();

      sub.cancel();

      expect(sub.status.isCanceled()).toBe(true);
    });

    it("SubscriptionCanceled ドメインイベントを発行する", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();

      sub.cancel();

      const events = sub.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionCanceled);
    });

    it("既に canceled な場合は no-op (冪等)", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.pullDomainEvents();
      sub.cancel();
      sub.pullDomainEvents();

      sub.cancel();

      expect(sub.status.isCanceled()).toBe(true);
      expect(sub.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe("attachStripe()", () => {
    it("stripeSubscriptionId を設定できる", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.attachStripe("sub_stripe_xyz");
      expect(sub.stripeSubscriptionId).toBe("sub_stripe_xyz");
    });

    it("同一の stripeSubscriptionId を再 attach するのは冪等として許容される", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.attachStripe("sub_stripe_xyz");
      expect(() => sub.attachStripe("sub_stripe_xyz")).not.toThrow();
    });

    it("異なる stripeSubscriptionId が設定済みの場合は DomainError — 重複 attach 防止", () => {
      const sub = Subscription.createFree(TEST_TENANT_ID);
      sub.attachStripe("sub_stripe_aaa");

      expect(() => sub.attachStripe("sub_stripe_bbb")).toThrow(DomainError);
      expect(() => sub.attachStripe("sub_stripe_bbb")).toThrow(
        "Stripe subscription ID is already attached with a different value",
      );
    });
  });
});
