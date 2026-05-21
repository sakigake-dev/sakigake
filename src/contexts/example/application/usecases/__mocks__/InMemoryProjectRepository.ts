import type { IProjectRepository } from "../../../domain/repositories/IProjectRepository";
import type { Project } from "../../../domain/models/Project";
import type { ProjectId } from "../../../domain/valueObjects/ProjectId";
import type { ProjectName } from "../../../domain/valueObjects/ProjectName";
import type { TenantId } from "../../../domain/valueObjects/TenantId";

/**
 * テスト用 InMemory Repository。
 * Domain Repository interface を実装し、永続化を Map で代替する。
 */
export class InMemoryProjectRepository implements IProjectRepository {
  private projects = new Map<string, Project>();

  async save(project: Project): Promise<void> {
    this.projects.set(project.id.value, project);
  }

  async findById(id: ProjectId): Promise<Project | null> {
    return this.projects.get(id.value) ?? null;
  }

  async findByTenantIdAndName(
    tenantId: TenantId,
    name: ProjectName,
  ): Promise<Project | null> {
    for (const project of this.projects.values()) {
      if (project.tenantId.equals(tenantId) && project.name.equals(name)) {
        return project;
      }
    }
    return null;
  }

  async listByTenantId(tenantId: TenantId): Promise<Project[]> {
    const result: Project[] = [];
    for (const project of this.projects.values()) {
      if (project.tenantId.equals(tenantId)) {
        result.push(project);
      }
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Test helper
  clear(): void {
    this.projects.clear();
  }
}
