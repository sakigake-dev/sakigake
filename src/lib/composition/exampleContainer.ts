/**
 * example context の Composition Root — DI Container.
 *
 * Project ドメインの全 UseCase を依存性注入で組み立てるファクトリ。
 * 顧客が「自分のドメインを Next.js Route Handler / Server Component から呼ぶ
 * 配線パターン」の完成形として参考にする。
 *
 * 使用例 (Server Component):
 *   const container = await createServerExampleContainer();
 *   const tenantId = await getTenantIdFromSession();
 *   const { projects } = await container.listProjects.execute({ tenantId });
 *
 * 設計判断:
 * - SupabaseClient は composition/supabase.ts 経由で取得 (各 context は知らない)
 * - eventPublisher は optional。未注入の場合 Domain Event は破棄される
 *   (Phase B 時点では同期実行で十分。Inngest 導入時に注入する)
 * - Container interface を export し、顧客が自前 Container を作る際の型契約とする
 *
 * 関連:
 * - ADR-0003 (Bounded Context 間の通信)
 * - ADR-0005 (Inngest による非同期イベント、将来導入)
 */

import type { IEventPublisher } from "@/contexts/example/application/events/IEventPublisher";
import { ArchiveProjectUseCase } from "@/contexts/example/application/usecases/ArchiveProjectUseCase";
import { CreateProjectUseCase } from "@/contexts/example/application/usecases/CreateProjectUseCase";
import { ListProjectsUseCase } from "@/contexts/example/application/usecases/ListProjectsUseCase";
import { ReactivateProjectUseCase } from "@/contexts/example/application/usecases/ReactivateProjectUseCase";
import { RenameProjectUseCase } from "@/contexts/example/application/usecases/RenameProjectUseCase";
import { SupabaseProjectRepository } from "@/contexts/example/infrastructure/repositories/SupabaseProjectRepository";
import { createServerSupabaseClient } from "./supabase";

/**
 * example context の Container 型契約。
 * 顧客が自分の context で Container を作る際もこの形に揃えると一貫性が保たれる。
 */
export interface ExampleContainer {
  createProject: CreateProjectUseCase;
  listProjects: ListProjectsUseCase;
  renameProject: RenameProjectUseCase;
  archiveProject: ArchiveProjectUseCase;
  reactivateProject: ReactivateProjectUseCase;
}

/**
 * Server-side Container を生成する。
 *
 * Server Component / Route Handler / Server Action 内で呼ぶ。
 * Clerk セッション必須 (createServerSupabaseClient が JWT を要求する)。
 *
 * @param eventPublisher Optional. 未指定なら Domain Event は破棄される。
 *                       将来 Inngest 等の本番実装を渡す差し込みポイント。
 */
export async function createServerExampleContainer(
  eventPublisher?: IEventPublisher,
): Promise<ExampleContainer> {
  const supabase = await createServerSupabaseClient();
  const projectRepository = new SupabaseProjectRepository(supabase);

  return {
    createProject: new CreateProjectUseCase(projectRepository, eventPublisher),
    listProjects: new ListProjectsUseCase(projectRepository),
    renameProject: new RenameProjectUseCase(projectRepository, eventPublisher),
    archiveProject: new ArchiveProjectUseCase(projectRepository, eventPublisher),
    reactivateProject: new ReactivateProjectUseCase(projectRepository, eventPublisher),
  };
}
