import { beforeEach, describe, expect, it } from "vitest";
import { ArchiveProjectUseCase } from "./ArchiveProjectUseCase";
import { CreateProjectUseCase } from "./CreateProjectUseCase";
import { ListProjectsUseCase } from "./ListProjectsUseCase";
import { InMemoryProjectRepository } from "./__mocks__/InMemoryProjectRepository";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_TENANT_ID = "660e8400-e29b-41d4-a716-446655440000";
const OWNER_ID = "user_owner001";

describe("ListProjectsUseCase", () => {
  let repository: InMemoryProjectRepository;
  let createUC: CreateProjectUseCase;
  let archiveUC: ArchiveProjectUseCase;
  let listUC: ListProjectsUseCase;

  beforeEach(() => {
    repository = new InMemoryProjectRepository();
    createUC = new CreateProjectUseCase(repository);
    archiveUC = new ArchiveProjectUseCase(repository);
    listUC = new ListProjectsUseCase(repository);
  });

  it("tenant 内の active な Project のみを返す (default)", async () => {
    const r1 = await createUC.execute({
      tenantId: TENANT_ID,
      name: "Active 1",
      ownerId: OWNER_ID,
    });
    await createUC.execute({
      tenantId: TENANT_ID,
      name: "Active 2",
      ownerId: OWNER_ID,
    });
    const r3 = await createUC.execute({
      tenantId: TENANT_ID,
      name: "Archived",
      ownerId: OWNER_ID,
    });
    await archiveUC.execute({ projectId: r3.projectId });

    const result = await listUC.execute({ tenantId: TENANT_ID });

    expect(result.projects).toHaveLength(2);
    expect(result.projects.every((p) => p.status === "active")).toBe(true);
    expect(result.projects.map((p) => p.name)).toContain("Active 1");
    expect(result.projects.map((p) => p.name)).toContain("Active 2");
    // Ensure archived project is filtered out
    expect(result.projects.find((p) => p.id === r1.projectId)).toBeDefined();
  });

  it("includeArchived=true なら archived も含む", async () => {
    const r1 = await createUC.execute({
      tenantId: TENANT_ID,
      name: "Active",
      ownerId: OWNER_ID,
    });
    const r2 = await createUC.execute({
      tenantId: TENANT_ID,
      name: "Archived",
      ownerId: OWNER_ID,
    });
    await archiveUC.execute({ projectId: r2.projectId });

    const result = await listUC.execute({
      tenantId: TENANT_ID,
      includeArchived: true,
    });

    expect(result.projects).toHaveLength(2);
    expect(result.projects.some((p) => p.status === "archived")).toBe(true);
    expect(result.projects.some((p) => p.id === r1.projectId)).toBe(true);
  });

  it("別 tenant の Project は含まれない", async () => {
    await createUC.execute({
      tenantId: TENANT_ID,
      name: "Mine",
      ownerId: OWNER_ID,
    });
    await createUC.execute({
      tenantId: OTHER_TENANT_ID,
      name: "Theirs",
      ownerId: OWNER_ID,
    });

    const result = await listUC.execute({ tenantId: TENANT_ID });

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].name).toBe("Mine");
  });

  it("Project が無い tenant は空配列を返す", async () => {
    const result = await listUC.execute({ tenantId: TENANT_ID });
    expect(result.projects).toHaveLength(0);
  });
});
