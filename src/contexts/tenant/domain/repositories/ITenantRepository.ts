import type { Tenant } from "../models/Tenant";
import type { TenantId } from "../valueObjects/TenantId";
import type { ClerkOrganizationId } from "../valueObjects/ClerkOrganizationId";

export interface ITenantRepository {
  findById(id: TenantId): Promise<Tenant | null>;
  findByClerkOrganizationId(
    id: ClerkOrganizationId,
  ): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
}
