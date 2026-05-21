import type { Project } from "../models/Project";
import type { ProjectId } from "../valueObjects/ProjectId";
import type { ProjectName } from "../valueObjects/ProjectName";
import type { TenantId } from "../valueObjects/TenantId";

/**
 * IProjectRepository - Project Aggregate の永続化境界。
 *
 * Domain 層に interface を置き、Infrastructure 層が実装する (依存性逆転)。
 * Application 層 (UseCase) はこの interface のみに依存し、具体実装 (Supabase等) を知らない。
 *
 * 結果: テストでは InMemory 実装、本番では Supabase 実装、と差し替え可能。
 */
export interface IProjectRepository {
  /**
   * Project を保存 (新規 or 更新)。upsert として動作する想定。
   */
  save(project: Project): Promise<void>;

  /**
   * id で Project を取得。見つからない場合 null。
   */
  findById(id: ProjectId): Promise<Project | null>;

  /**
   * tenant 内で同じ名前の Project を取得 (uniqueness check 用)。
   * tenant 内で 1 つに絞れる前提。
   */
  findByTenantIdAndName(
    tenantId: TenantId,
    name: ProjectName,
  ): Promise<Project | null>;

  /**
   * tenant 内の Project 一覧。created_at 降順。
   * archived も含む。フィルタは Application 層で行う。
   */
  listByTenantId(tenantId: TenantId): Promise<Project[]>;
}
