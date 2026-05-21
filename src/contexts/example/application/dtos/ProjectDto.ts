import type { Project } from "../../domain/models/Project";

/**
 * Presentation 層に Project を返すための DTO。
 *
 * Domain VO (ProjectId, ProjectName, etc.) は Application/Domain 内のみで使い、
 * 外 (Web / API レスポンス) には primitive で渡す。
 */
export type ProjectDto = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export function toProjectDto(project: Project): ProjectDto {
  return {
    id: project.id.value,
    tenantId: project.tenantId.value,
    name: project.name.value,
    description: project.description.value,
    status: project.status.value,
    ownerId: project.ownerId.value,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
