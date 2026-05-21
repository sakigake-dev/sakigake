import type { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectName } from "../../domain/valueObjects/ProjectName";
import type { IEventPublisher } from "../events/IEventPublisher";
import { ProjectAlreadyExistsError } from "../errors/ProjectAlreadyExistsError";
import { ProjectNotFoundError } from "../errors/ProjectNotFoundError";

export type RenameProjectInput = {
  projectId: string;
  newName: string;
};

/**
 * Project の名前を変更する UseCase。
 *
 * - Project が見つからなければ ProjectNotFoundError
 * - 同じ tenant 内で別 Project と名前が衝突したら ProjectAlreadyExistsError
 * - 同じ名前への rename は Domain 側で no-op (event 発行なし)
 */
export class RenameProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: RenameProjectInput): Promise<void> {
    const projectId = ProjectId.from(input.projectId);
    const newName = ProjectName.from(input.newName);

    const project = await this.projectRepository.findById(projectId);
    if (project === null) {
      throw new ProjectNotFoundError(projectId.value);
    }

    if (!project.name.equals(newName)) {
      const conflict = await this.projectRepository.findByTenantIdAndName(
        project.tenantId,
        newName,
      );
      if (conflict !== null && !conflict.id.equals(projectId)) {
        throw new ProjectAlreadyExistsError(newName.value);
      }
    }

    project.rename(newName);
    await this.projectRepository.save(project);

    const events = project.pullDomainEvents();
    await this.eventPublisher?.publish(events);
  }
}
