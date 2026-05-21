import type { Tenant } from "../../../domain/models/Tenant";
import type { TenantId } from "../../../domain/valueObjects/TenantId";
import type { ClerkOrganizationId } from "../../../domain/valueObjects/ClerkOrganizationId";
import type { ITenantRepository } from "../../../domain/repositories/ITenantRepository";

/**
 * UseCase テスト専用の in-memory ITenantRepository 実装。
 * Production コードから import してはならない。
 */
export class InMemoryTenantRepository implements ITenantRepository {
  private readonly store = new Map<string, Tenant>();

  async findById(id: TenantId): Promise<Tenant | null> {
    return this.store.get(id.value) ?? null;
  }

  async findByClerkOrganizationId(id: ClerkOrganizationId): Promise<Tenant | null> {
    for (const tenant of this.store.values()) {
      if (tenant.clerkOrganizationId.equals(id)) {
        return tenant;
      }
    }
    return null;
  }

  async save(tenant: Tenant): Promise<void> {
    this.store.set(tenant.id.value, tenant);
  }

  size(): number {
    return this.store.size;
  }
}
