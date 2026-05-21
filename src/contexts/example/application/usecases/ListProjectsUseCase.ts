import type { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { toProjectDto, type ProjectDto } from "../dtos/ProjectDto";

export type ListProjectsInput = {
  tenantId: string;
  includeArchived?: boolean;
};

export type ListProjectsOutput = {
  projects: ProjectDto[];
};

/**
 * tenant 内の Project 一覧を返す UseCase。
 *
 * - includeArchived=false (default): active のみ
 * - includeArchived=true: archived も含む
 * - 並びは createdAt 降順 (Repository 実装側で保証)
 */
export class ListProjectsUseCase {
  constructor(private readonly projectRepository: IProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<ListProjectsOutput> {
    const tenantId = TenantId.from(input.tenantId);
    const projects = await this.projectRepository.listByTenantId(tenantId);

    const filtered = input.includeArchived
      ? projects
      : projects.filter((p) => p.status.isActive());

    return { projects: filtered.map(toProjectDto) };
  }
}
