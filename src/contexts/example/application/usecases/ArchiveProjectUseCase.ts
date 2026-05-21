import type { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import type { IEventPublisher } from "../events/IEventPublisher";
import { ProjectNotFoundError } from "../errors/ProjectNotFoundError";

export type ArchiveProjectInput = {
  projectId: string;
};

export class ArchiveProjectUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  async execute(input: ArchiveProjectInput): Promise<void> {
    const projectId = ProjectId.from(input.projectId);
    const project = await this.projectRepository.findById(projectId);
    if (project === null) {
      throw new ProjectNotFoundError(projectId.value);
    }

    project.archive();
    await this.projectRepository.save(project);

    const events = project.pullDomainEvents();
    await this.eventPublisher?.publish(events);
  }
}
