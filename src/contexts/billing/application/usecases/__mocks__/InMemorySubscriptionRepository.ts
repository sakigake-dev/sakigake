import type { Subscription } from "../../../domain/models/Subscription";
import type { SubscriptionId } from "../../../domain/valueObjects/SubscriptionId";
import type { TenantId } from "../../../domain/valueObjects/TenantId";
import type { ISubscriptionRepository } from "../../../domain/repositories/ISubscriptionRepository";

/**
 * UseCase テスト専用の in-memory ISubscriptionRepository 実装。
 * Production コードから import してはならない。
 */
export class InMemorySubscriptionRepository implements ISubscriptionRepository {
  private readonly store = new Map<string, Subscription>();

  async findById(id: SubscriptionId): Promise<Subscription | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByTenantId(tenantId: TenantId): Promise<Subscription | null> {
    for (const subscription of this.store.values()) {
      if (subscription.tenantId.equals(tenantId)) {
        return subscription;
      }
    }
    return null;
  }

  async save(subscription: Subscription): Promise<void> {
    this.store.set(subscription.id.value, subscription);
  }

  size(): number {
    return this.store.size;
  }
}
