import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "../../domain/models/Project";
import type { IProjectRepository } from "../../domain/repositories/IProjectRepository";
import type { ProjectId } from "../../domain/valueObjects/ProjectId";
import type { ProjectName } from "../../domain/valueObjects/ProjectName";
import type { TenantId } from "../../domain/valueObjects/TenantId";
import { fromRow, toRow, type ProjectRow } from "../mappers/projectMapper";

const TABLE = "projects";

/**
 * Supabase 実装の Project Repository。
 *
 * IProjectRepository (Domain interface) を実装。Composition Root で注入される。
 * テストは InMemoryProjectRepository で行うため、ここではユニットテストは持たない。
 * (本番動作確認は Supabase 接続済みの統合テストで行う想定)
 *
 * RLS により、tenant_id が現在のユーザーの組織に紐づく Project のみ取得・更新可能。
 * service role を使う管理処理 (webhook 等) のみ RLS bypass する。
 */
export class SupabaseProjectRepository implements IProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(project: Project): Promise<void> {
    const row = toRow(project);
    const { error } = await this.supabase.from(TABLE).upsert(row);
    if (error) {
      throw new Error(`Failed to save Project: ${error.message}`);
    }
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select("*")
      .eq("id", id.value)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find Project by id: ${error.message}`);
    }
    return data ? fromRow(data as ProjectRow) : null;
  }

  async findByTenantIdAndName(
    tenantId: TenantId,
    name: ProjectName,
  ): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId.value)
      .eq("name", name.value)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to find Project by name: ${error.message}`);
    }
    return data ? fromRow(data as ProjectRow) : null;
  }

  async listByTenantId(tenantId: TenantId): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId.value)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list Projects: ${error.message}`);
    }
    return (data as ProjectRow[]).map(fromRow);
  }
}
