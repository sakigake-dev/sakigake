import { beforeEach, describe, expect, it } from "vitest";
import { ProjectReactivated } from "../../domain/events/ProjectReactivated";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectNotFoundError } from "../errors/ProjectNotFoundError";
import { ArchiveProjectUseCase } from "./ArchiveProjectUseCase";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { ReactivateProjectUseCase } from "./ReactivateProjectUseCase";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { InMemoryProjectRepository } from "./__mocks__/InMemoryProjectRepository";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OWNER_ID = "user_owner001";

describe("ReactivateProjectUseCase", () => {
  let repository: InMemoryProjectRepository;
  let publisher: InMemoryEventPublisher;
  let createUC: CreateProjectUseCase;
  let archiveUC: ArchiveProjectUseCase;
  let reactivateUC: ReactivateProjectUseCase;
  let projectId: string;

  beforeEach(async () => {
    repository = new InMemoryProjectRepository();
    publisher = new InMemoryEventPublisher();
    createUC = new CreateProjectUseCase(repository);
    archiveUC = new ArchiveProjectUseCase(repository);
    reactivateUC = new ReactivateProjectUseCase(repository, publisher);

    const result = await createUC.execute({
      tenantId: TENANT_ID,
      name: "To Reactivate",
      ownerId: OWNER_ID,
    });
    projectId = result.projectId;
    await archiveUC.execute({ projectId });
  });

  it("archived な Project を active に戻し ProjectReactivated を publish する", async () => {
    await reactivateUC.execute({ projectId });

    const saved = await repository.findById(ProjectId.from(projectId));
    expect(saved!.status.isActive()).toBe(true);

    expect(publisher.publishedEvents).toHaveLength(1);
    expect(publisher.publishedEvents[0]).toBeInstanceOf(ProjectReactivated);
  });

  it("見つからない projectId は ProjectNotFoundError", async () => {
    await expect(
      reactivateUC.execute({ projectId: "00000000-0000-0000-0000-000000000000" }),
    ).rejects.toThrow(ProjectNotFoundError);
  });

  it("既に active な Project の reactivate は DomainError が伝播する", async () => {
    await reactivateUC.execute({ projectId });

    await expect(reactivateUC.execute({ projectId })).rejects.toThrow();
  });
});
