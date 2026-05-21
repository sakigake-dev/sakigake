import type { Tenant } from "../../domain/models/Tenant";

export type TenantMembershipDto = {
  userClerkId: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
};

export type TenantDto = {
  id: string;
  name: string;
  clerkOrganizationId: string;
  status: "active" | "suspended";
  memberships: TenantMembershipDto[];
};

/**
 * Tenant Aggregate を Presentation 層へ渡すための plain object 表現。
 *
 * 現状: UseCase の戻り値では未使用 (CreateTenantUseCase は tenantId のみ返す)。
 * 次フェーズで GetTenantUseCase / Webhook handler の応答整形・将来のダッシュボード
 * 用 GET API で利用する。Aggregate を直接 Presentation 層に露出させない方針
 * (AGENTS.md "原始型をドメイン境界に露出させない" の双対) の準備として先行配置している。
 */
export function toTenantDto(tenant: Tenant): TenantDto {
  return {
    id: tenant.id.value,
    name: tenant.name.value,
    clerkOrganizationId: tenant.clerkOrganizationId.value,
    status: tenant.status.value,
    memberships: tenant.memberships.map((m) => ({
      userClerkId: m.userId.value,
      role: m.role.value,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
