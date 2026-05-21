import type { Subscription } from "../models/Subscription";
import type { SubscriptionId } from "../valueObjects/SubscriptionId";
import type { TenantId } from "../valueObjects/TenantId";

export interface ISubscriptionRepository {
  findById(id: SubscriptionId): Promise<Subscription | null>;
  /**
   * テナントあたり1サブスクリプションの制約 (UNIQUE (tenant_id)) に従い、
   * 該当テナントのサブスクリプションを返す。
   */
  findByTenantId(tenantId: TenantId): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
}
