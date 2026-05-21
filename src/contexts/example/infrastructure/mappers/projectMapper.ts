import { Project } from "../../domain/models/Project";
import { ProjectDescription } from "../../domain/valueObjects/ProjectDescription";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectName } from "../../domain/valueObjects/ProjectName";
import { ProjectStatus } from "../../domain/valueObjects/ProjectStatus";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { UserId } from "../../domain/valueObjects/UserId";

/**
 * Supabase の projects テーブルのレコード形。
 * snake_case で DB と一致させる。
 */
export type ProjectRow = {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Domain Project → DB Row 変換 (save 用)。
 */
export function toRow(project: Project): ProjectRow {
  return {
    id: project.id.value,
    tenant_id: project.tenantId.value,
    name: project.name.value,
    description: project.description.value,
    status: project.status.value,
    owner_id: project.ownerId.value,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
  };
}

/**
 * DB Row → Domain Project 復元 (find 系で使用)。
 * 各 VO の from() が失敗すれば DomainError が伝播する (DB 状態が不正)。
 */
export function fromRow(row: ProjectRow): Project {
  return Project.reconstitute({
    id: ProjectId.from(row.id),
    tenantId: TenantId.from(row.tenant_id),
    name: ProjectName.from(row.name),
    description: ProjectDescription.from(row.description),
    status: ProjectStatus.from(row.status),
    ownerId: UserId.from(row.owner_id),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}
