import { SubscriptionId } from "../valueObjects/SubscriptionId";
import type { TenantId } from "../valueObjects/TenantId";
import { Plan } from "../valueObjects/Plan";
import { SubscriptionStatus } from "../valueObjects/SubscriptionStatus";
import { DomainError } from "../errors/DomainError";
import type { DomainEvent } from "../events/DomainEvent";
import { SubscriptionCreated } from "../events/SubscriptionCreated";
import { PlanChanged } from "../events/PlanChanged";
import { SubscriptionCanceled } from "../events/SubscriptionCanceled";

export class Subscription {
  private readonly _id: SubscriptionId;
  private readonly _tenantId: TenantId;
  private _plan: Plan;
  private _status: SubscriptionStatus;
  /**
   * Stripe サブスクリプション ID。Phase 4 で Stripe 連携を導入するまで null。
   * attachStripe() で設定される。
   */
  private _stripeSubscriptionId: string | null;
  private _domainEvents: DomainEvent[];

  private constructor(
    id: SubscriptionId,
    tenantId: TenantId,
    plan: Plan,
    status: SubscriptionStatus,
    stripeSubscriptionId: string | null,
    domainEvents: DomainEvent[],
  ) {
    this._id = id;
    this._tenantId = tenantId;
    this._plan = plan;
    this._status = status;
    this._stripeSubscriptionId = stripeSubscriptionId;
    this._domainEvents = domainEvents;
  }

  /**
   * Tenant 作成時に呼ばれるファクトリ。plan = free、status = active で初期化する。
   * SubscriptionCreated ドメインイベントを発行する。
   */
  static createFree(tenantId: TenantId): Subscription {
    const id = SubscriptionId.generate();
    const subscription = new Subscription(
      id,
      tenantId,
      Plan.free(),
      SubscriptionStatus.active(),
      null,
      [],
    );
    subscription._domainEvents.push(
      new SubscriptionCreated(id, tenantId, Plan.free()),
    );
    return subscription;
  }

  /**
   * Repository からの復元用ファクトリ。ドメインイベントは発行しない。
   */
  static reconstruct(
    id: SubscriptionId,
    tenantId: TenantId,
    plan: Plan,
    status: SubscriptionStatus,
    stripeSubscriptionId: string | null,
  ): Subscription {
    return new Subscription(id, tenantId, plan, status, stripeSubscriptionId, []);
  }

  get id(): SubscriptionId {
    return this._id;
  }

  get tenantId(): TenantId {
    return this._tenantId;
  }

  get plan(): Plan {
    return this._plan;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get stripeSubscriptionId(): string | null {
    return this._stripeSubscriptionId;
  }

  /**
   * プランを変更する。
   *
   * 不変条件: canceled な Subscription はプラン変更不可。
   * (canceled 後は新規サブスクリプションを作成する設計。Plan 002 §2-3 参照)
   */
  upgradePlan(newPlan: Plan): void {
    if (this._status.isCanceled()) {
      throw new DomainError("Cannot upgrade a canceled subscription");
    }
    const oldPlan = this._plan;
    this._plan = newPlan;
    this._domainEvents.push(new PlanChanged(this._id, oldPlan, newPlan));
  }

  /**
   * サブスクリプションをキャンセルする。
   *
   * 冪等: 既に canceled な場合は no-op。
   * SubscriptionCanceled ドメインイベントを発行する (active → canceled 遷移時のみ)。
   */
  cancel(): void {
    if (this._status.isCanceled()) {
      return;
    }
    this._status = SubscriptionStatus.canceled();
    this._domainEvents.push(new SubscriptionCanceled(this._id));
  }

  /**
   * Stripe サブスクリプション ID を紐付ける。Phase 4 (Stripe 導入) で使用する。
   *
   * 不変条件: 既に異なる stripeSubscriptionId が設定済みの場合は DomainError。
   * (重複 attach による Stripe 課金の二重化を防ぐ)
   *
   * 同一の値を再 attach するのは冪等として許容し、ドメインイベントは発行しない
   * (Webhook 再送等で同じ Stripe ID が複数回届くケースを no-op として吸収する)。
   */
  attachStripe(stripeSubscriptionId: string): void {
    if (
      this._stripeSubscriptionId !== null &&
      this._stripeSubscriptionId !== stripeSubscriptionId
    ) {
      throw new DomainError(
        "Stripe subscription ID is already attached with a different value",
      );
    }
    this._stripeSubscriptionId = stripeSubscriptionId;
  }

  /**
   * 発行済みドメインイベントを取り出してクリアする (consume-once 方式)。
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
