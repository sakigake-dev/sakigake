import type { SupabaseClient } from "@supabase/supabase-js";
import type { ITenantRepository } from "../../domain/repositories/ITenantRepository";
import { Tenant } from "../../domain/models/Tenant";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { ClerkOrganizationId } from "../../domain/valueObjects/ClerkOrganizationId";
import {
  tenantRowToDomain,
  tenantToRow,
  membershipsToRows,
  type TenantRow,
  type MembershipRow,
} from "../mappers/tenantMapper";

const TENANTS_TABLE = "tenants";
const MEMBERSHIPS_TABLE = "tenant_memberships";

// .single() で 0 行のとき Supabase が返すエラーコード
const SUPABASE_NO_ROWS_ERROR_CODE = "PGRST116";

export class SupabaseTenantRepository implements ITenantRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: TenantId): Promise<Tenant | null> {
    const { data: tenantRow, error: tenantError } = await this.client
      .from(TENANTS_TABLE)
      .select("*")
      .eq("id", id.value)
      .single();

    if (tenantError) {
      if (tenantError.code === SUPABASE_NO_ROWS_ERROR_CODE) {
        return null;
      }
      throw new Error(`Failed to fetch tenant: ${tenantError.message}`);
    }

    const membershipRows = await this.loadMembershipsByTenantId(
      (tenantRow as TenantRow).id,
    );

    return tenantRowToDomain(tenantRow as TenantRow, membershipRows);
  }

  async findByClerkOrganizationId(
    id: ClerkOrganizationId,
  ): Promise<Tenant | null> {
    const { data: tenantRow, error: tenantError } = await this.client
      .from(TENANTS_TABLE)
      .select("*")
      .eq("clerk_organization_id", id.value)
      .single();

    if (tenantError) {
      if (tenantError.code === SUPABASE_NO_ROWS_ERROR_CODE) {
        return null;
      }
      throw new Error(`Failed to fetch tenant: ${tenantError.message}`);
    }

    const membershipRows = await this.loadMembershipsByTenantId(
      (tenantRow as TenantRow).id,
    );

    return tenantRowToDomain(tenantRow as TenantRow, membershipRows);
  }

  /**
   * 設計上の制約 (非トランザクション):
   * Supabase JS client は単発SQLしか発行できないため、save() は
   * tenants UPSERT → memberships DELETE → memberships UPSERT の3クエリに分かれる。
   * 部分失敗時 (例: 2クエリ目で500エラー) はデータが不整合になる可能性がある。
   *
   * 緩和策:
   * 1. 当面の運用: Tenant Aggregate の永続化トリガーは Clerk Webhook (organization.created/.updated)
   *    のみとし、Clerk 側を Single Source of Truth と扱う。Webhook 再送 (Svix) で
   *    冪等に再同期される (Plan 002 §4-3, R-05 参照)。
   * 2. 将来: Supabase RPC (PL/pgSQL) で transactional save を実装する余地あり。
   *    Recording context の Meeting Aggregate でも同じ判断を再利用する。
   */
  async save(tenant: Tenant): Promise<void> {
    const tenantRow = tenantToRow(tenant);

    // 1. tenants テーブルへの UPSERT
    const { error: tenantError } = await this.client
      .from(TENANTS_TABLE)
      .upsert(tenantRow, { onConflict: "id" });

    if (tenantError) {
      throw new Error(`Failed to upsert tenant: ${tenantError.message}`);
    }

    // 2. 現在の memberships を DB から取得して差分を計算する
    const { data: existingRows, error: fetchError } = await this.client
      .from(MEMBERSHIPS_TABLE)
      .select("clerk_user_id")
      .eq("tenant_id", tenant.id.value);

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing memberships: ${fetchError.message}`,
      );
    }

    const existingUserIds = new Set(
      (existingRows ?? []).map(
        (r: { clerk_user_id: string }) => r.clerk_user_id,
      ),
    );
    const desiredUserIds = new Set(
      tenant.memberships.map((m) => m.userId.value),
    );

    const toDelete = [...existingUserIds].filter(
      (id) => !desiredUserIds.has(id),
    );

    // 3a. 削除されたメンバーを DELETE
    if (toDelete.length > 0) {
      const { error: deleteError } = await this.client
        .from(MEMBERSHIPS_TABLE)
        .delete()
        .eq("tenant_id", tenant.id.value)
        .in("clerk_user_id", toDelete);

      if (deleteError) {
        throw new Error(
          `Failed to delete removed memberships: ${deleteError.message}`,
        );
      }
    }

    // 3b. 新規・更新メンバーを UPSERT
    const membershipRows = membershipsToRows(tenant);
    if (membershipRows.length > 0) {
      const { error: membershipError } = await this.client
        .from(MEMBERSHIPS_TABLE)
        .upsert(membershipRows, { onConflict: "tenant_id,clerk_user_id" });

      if (membershipError) {
        throw new Error(
          `Failed to upsert memberships: ${membershipError.message}`,
        );
      }
    }

    // Domain Events は永続化しない。
    // Application 層が pullDomainEvents() を呼び出してイベントを処理する想定。
    // 将来 outbox pattern を導入する際は tenantMapper.ts の tenantToRow を拡張すること。
  }

  private async loadMembershipsByTenantId(
    tenantId: string,
  ): Promise<MembershipRow[]> {
    const { data, error } = await this.client
      .from(MEMBERSHIPS_TABLE)
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) {
      throw new Error(`Failed to fetch memberships: ${error.message}`);
    }

    return (data ?? []) as MembershipRow[];
  }
}
