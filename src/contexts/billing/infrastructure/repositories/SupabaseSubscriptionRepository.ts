import type { SupabaseClient } from "@supabase/supabase-js";
import type { ISubscriptionRepository } from "../../domain/repositories/ISubscriptionRepository";
import type { Subscription } from "../../domain/models/Subscription";
import type { SubscriptionId } from "../../domain/valueObjects/SubscriptionId";
import type { TenantId } from "../../domain/valueObjects/TenantId";
import {
  subscriptionRowToDomain,
  subscriptionToRow,
  type SubscriptionRow,
} from "../mappers/subscriptionMapper";

const SUBSCRIPTIONS_TABLE = "subscriptions";

// .single() で 0 行のとき Supabase が返すエラーコード
const SUPABASE_NO_ROWS_ERROR_CODE = "PGRST116";

export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: SubscriptionId): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("id", id.value)
      .single();

    if (error) {
      if (error.code === SUPABASE_NO_ROWS_ERROR_CODE) {
        return null;
      }
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return subscriptionRowToDomain(data as SubscriptionRow);
  }

  async findByTenantId(tenantId: TenantId): Promise<Subscription | null> {
    const { data, error } = await this.client
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId.value)
      .single();

    if (error) {
      if (error.code === SUPABASE_NO_ROWS_ERROR_CODE) {
        return null;
      }
      throw new Error(
        `Failed to fetch subscription by tenant: ${error.message}`,
      );
    }

    return subscriptionRowToDomain(data as SubscriptionRow);
  }

  /**
   * Subscription を UPSERT する。
   *
   * subscriptions テーブルには UNIQUE (tenant_id) 制約があるため、
   * onConflict: 'tenant_id' で既存行を更新する。
   * これにより save() は冪等に動作する。
   */
  async save(subscription: Subscription): Promise<void> {
    const row = subscriptionToRow(subscription);

    const { error } = await this.client
      .from(SUBSCRIPTIONS_TABLE)
      .upsert(row, { onConflict: "tenant_id" });

    if (error) {
      throw new Error(`Failed to upsert subscription: ${error.message}`);
    }
  }
}
