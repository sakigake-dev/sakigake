import { beforeEach, describe, expect, it } from "vitest";
import { ProjectRenamed } from "../../domain/events/ProjectRenamed";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectAlreadyExistsError } from "../errors/ProjectAlreadyExistsError";
import { ProjectNotFoundError } from "../errors/ProjectNotFoundError";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { RenameProjectUseCase } from "./RenameProjectUseCase";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { InMemoryProjectRepository } from "./__mocks__/InMemoryProjectRepository";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OWNER_ID = "user_owner001";

describe("RenameProjectUseCase", () => {
  let repository: InMemoryProjectRepository;
  let publisher: InMemoryEventPublisher;
  let createUC: CreateProjectUseCase;
  let renameUC: RenameProjectUseCase;
  let projectId: string;

  beforeEach(async () => {
    repository = new InMemoryProjectRepository();
    publisher = new InMemoryEventPublisher();
    createUC = new CreateProjectUseCase(repository);
    renameUC = new RenameProjectUseCase(repository, publisher);

    const result = await createUC.execute({
      tenantId: TENANT_ID,
      name: "Original Name",
      ownerId: OWNER_ID,
    });
    projectId = result.projectId;
  });

  it("Project の名前を変更し ProjectRenamed イベントを publish する", async () => {
    await renameUC.execute({ projectId, newName: "New Name" });

    const saved = await repository.findById(ProjectId.from(projectId));
    expect(saved!.name.value).toBe("New Name");

    expect(publisher.publishedEvents).toHaveLength(1);
    expect(publisher.publishedEvents[0]).toBeInstanceOf(ProjectRenamed);
  });

  it("見つからない projectId は ProjectNotFoundError", async () => {
    await expect(
      renameUC.execute({
        projectId: "00000000-0000-0000-0000-000000000000",
        newName: "x",
      }),
    ).rejects.toThrow(ProjectNotFoundError);
  });

  it("同じ tenant 内の別 Project と同名にしようとすると ProjectAlreadyExistsError", async () => {
    await createUC.execute({
      tenantId: TENANT_ID,
      name: "Other Project",
      ownerId: OWNER_ID,
    });

    await expect(
      renameUC.execute({ projectId, newName: "Other Project" }),
    ).rejects.toThrow(ProjectAlreadyExistsError);
  });

  it("同じ名前への rename は no-op (event 発行なし)", async () => {
    await renameUC.execute({ projectId, newName: "Original Name" });

    expect(publisher.publishedEvents).toHaveLength(0);
  });

  it("無効な name (空文字) は DomainError が伝播する", async () => {
    await expect(
      renameUC.execute({ projectId, newName: "" }),
    ).rejects.toThrow();
  });
});
