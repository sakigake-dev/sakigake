import { Project } from "../../domain/models/Project";
import type { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { ProjectDescription } from "../../domain/valueObjects/ProjectDescription";
import { ProjectName } from "../../domain/valueObjects/ProjectName";
import { TenantId } from "../../domain/valueObjects/TenantId";
import { UserId } from "../../domain/valueObjects/UserId";
import type { IEventPublisher } from "../events/IEventPublisher";
import { ProjectAlreadyExistsError } from "../errors/ProjectAlreadyExistsError";

export type CreateProjectInput = {
  tenantId: string;
  name: string;
  description?: string;
  ownerId: string;
};

export type CreateProjectOutput = {
  projectId: string;
};

/**
 * 新規 Project を作成する UseCase。
 *
 * - tenantId / ownerId は context 境界では primitive (string) で受ける (ADR-0003)
 * - tenant 内の名前 uniqueness をチェックし、重複時は ProjectAlreadyExistsError
 * - Domain layer の Project.create() Factory を呼び、ProjectCreated イベントを発行
 */
export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const tenantId = TenantId.from(input.tenantId);
    const name = ProjectName.from(input.name);
    const description = input.description
      ? ProjectDescription.from(input.description)
      : ProjectDescription.empty();
    const ownerId = UserId.from(input.ownerId);

    const existing = await this.projectRepository.findByTenantIdAndName(
      tenantId,
      name,
    );
    if (existing !== null) {
      throw new ProjectAlreadyExistsError(name.value);
    }

    const project = Project.create({ tenantId, name, description, ownerId });
    await this.projectRepository.save(project);

    const events = project.pullDomainEvents();
    await this.eventPublisher?.publish(events);

    return { projectId: project.id.value };
  }
}
