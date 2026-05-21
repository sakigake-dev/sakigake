import { beforeEach, describe, expect, it } from "vitest";
import { ProjectCreated } from "../../domain/events/ProjectCreated";
import { ProjectId } from "../../domain/valueObjects/ProjectId";
import { ProjectAlreadyExistsError } from "../errors/ProjectAlreadyExistsError";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { InMemoryEventPublisher } from "./__mocks__/InMemoryEventPublisher";
import { InMemoryProjectRepository } from "./__mocks__/InMemoryProjectRepository";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_TENANT_ID = "660e8400-e29b-41d4-a716-446655440000";
const OWNER_ID = "user_owner001";

describe("CreateProjectUseCase", () => {
  let repository: InMemoryProjectRepository;
  let publisher: InMemoryEventPublisher;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    publisher = new InMemoryEventPublisher();
    useCase = new CreateProjectUseCase(repository, publisher);
  });

  it("Project を作成し保存する", async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      description: "First sprint of Q1",
      ownerId: OWNER_ID,
    });

    expect(result.projectId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}/i);

    const saved = await repository.findById(ProjectId.from(result.projectId));
    expect(saved).not.toBeNull();
    expect(saved!.name.value).toBe("Sprint 1");
    expect(saved!.description.value).toBe("First sprint of Q1");
    expect(saved!.status.isActive()).toBe(true);
  });

  it("ProjectCreated イベントを publish する", async () => {
    await useCase.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });

    expect(publisher.publishedEvents).toHaveLength(1);
    expect(publisher.publishedEvents[0]).toBeInstanceOf(ProjectCreated);
  });

  it("description を省略すると空文字で作られる", async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });

    const saved = await repository.findById(ProjectId.from(result.projectId));
    expect(saved!.description.isEmpty()).toBe(true);
  });

  it("同じ tenant に同名の Project があると ProjectAlreadyExistsError", async () => {
    await useCase.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        name: "Sprint 1",
        ownerId: OWNER_ID,
      }),
    ).rejects.toThrow(ProjectAlreadyExistsError);
  });

  it("別 tenant なら同名でも作成できる", async () => {
    await useCase.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });

    const result = await useCase.execute({
      tenantId: OTHER_TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });

    expect(result.projectId).toBeTruthy();
  });

  it("eventPublisher を渡さなくても動作する", async () => {
    const ucWithoutPublisher = new CreateProjectUseCase(repository);
    const result = await ucWithoutPublisher.execute({
      tenantId: TENANT_ID,
      name: "Sprint 1",
      ownerId: OWNER_ID,
    });
    expect(result.projectId).toBeTruthy();
  });
});
