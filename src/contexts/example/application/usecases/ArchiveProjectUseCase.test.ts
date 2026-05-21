import { beforeEach, describe, expect, it } from "vitest";
import { ProjectArchived } from "../../domain/events/ProjectArchived";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectNotFoundError } from "../errors/ProjectNotFoundError";
import { ArchiveProjectUseCase } from "./ArchiveProjectUseCase";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { InMemoryProjectRepository } from "./__mocks__/InMemoryProjectRepository";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OWNER_ID = "user_owner001";

describe("ArchiveProjectUseCase", () => {
  let repository: InMemoryProjectRepository;
  let publisher: InMemoryEventPublisher;
  let createUC: CreateProjectUseCase;
  let archiveUC: ArchiveProjectUseCase;
  let projectId: string;

  beforeEach(async () => {
    repository = new InMemoryProjectRepository();
    publisher = new InMemoryEventPublisher();
    createUC = new CreateProjectUseCase(repository);
    archiveUC = new ArchiveProjectUseCase(repository, publisher);

    const result = await createUC.execute({
      tenantId: TENANT_ID,
      name: "To Archive",
      ownerId: OWNER_ID,
    });
    projectId = result.projectId;
  });

  it("Project を archive し ProjectArchived イベントを publish する", async () => {
    await archiveUC.execute({ projectId });

    const saved = await repository.findById(ProjectId.from(projectId));
    expect(saved!.status.isArchived()).toBe(true);

    expect(publisher.publishedEvents).toHaveLength(1);
    expect(publisher.publishedEvents[0]).toBeInstanceOf(ProjectArchived);
  });

  it("見つからない projectId は ProjectNotFoundError", async () => {
    await expect(
      archiveUC.execute({ projectId: "00000000-0000-0000-0000-000000000000" }),
    ).rejects.toThrow(ProjectNotFoundError);
  });

  it("既に archived な Project の archive は DomainError が伝播する", async () => {
    await archiveUC.execute({ projectId });

    await expect(archiveUC.execute({ projectId })).rejects.toThrow();
  });
});
