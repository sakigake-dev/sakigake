/**
 * clerkWebhookHandler のユニットテスト。
 *
 * テスト方針:
 * - Svix 署名検証を vi.mock でバイパスし、UseCase の呼び出し可否を検証する。
 * - createClerkWebhookHandler(deps) ファクトリで UseCase モックを DI する。
 * - Repository モックは InMemoryTenantRepository を流用する。
 */

import { TenantId } from "../../domain/valueObjects/TenantId";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClerkWebhookHandler, type ClerkWebhookHandlerDeps } from "./clerkWebhookHandler";
import { InMemoryTenantRepository } from "../../application/usecases/__mocks__/InMemoryTenantRepository";
import { DomainError } from "../../domain/errors/DomainError";
import { ApplicationError } from "../../application/errors/ApplicationError";
import type { CreateTenantUseCase } from "../../application/usecases/CreateTenantUseCase";
import type { AddMemberUseCase } from "../../application/usecases/AddMemberUseCase";
import type { RemoveMemberUseCase } from "../../application/usecases/RemoveMemberUseCase";
import type { CreateInitialSubscriptionUseCase } from "../../application/hooks/CreateInitialSubscriptionUseCase";

// ─── Svix のモック ────────────────────────────────────────────────────────────
//
// Svix 署名検証をバイパスするため Webhook クラスをモック化する。
// モード1 (正常): verify() がペイロードをそのまま返す
// モード2 (失敗): verify() が WebhookVerificationError を投げる
//
let svixVerifyShouldFail = false;

vi.mock("svix", () => {
  const MockWebhook = vi.fn(function MockWebhookCtor() {
    return {
      verify: vi.fn().mockImplementation((payload: string) => {
        if (svixVerifyShouldFail) {
          const err = new Error("Webhook verification failed");
          err.name = "WebhookVerificationError";
          throw err;
        }
        return JSON.parse(payload);
      }),
    };
  });
  return { Webhook: MockWebhook };
});

// ─── 環境変数のモック ─────────────────────────────────────────────────────────

const MOCK_SIGNING_SECRET = "whsec_test_secret";

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function makeHeaders(): HeadersInit {
  return {
    "svix-id": "msg_test_123",
    "svix-timestamp": "1234567890",
    "svix-signature": "v1,test_signature",
    "content-type": "application/json",
  };
}

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(body),
  });
}

type MockUseCases = {
  createTenant: { execute: ReturnType<typeof vi.fn> };
  addMember: { execute: ReturnType<typeof vi.fn> };
  removeMember: { execute: ReturnType<typeof vi.fn> };
  createInitialSubscription: { execute: ReturnType<typeof vi.fn> };
};

function buildMockDeps(
  repository: InMemoryTenantRepository,
  overrides?: Partial<MockUseCases>,
): ClerkWebhookHandlerDeps {
  const defaults: MockUseCases = {
    createTenant: { execute: vi.fn().mockResolvedValue({ tenantId: "uuid-test-123" }) },
    addMember: { execute: vi.fn().mockResolvedValue(undefined) },
    removeMember: { execute: vi.fn().mockResolvedValue(undefined) },
    createInitialSubscription: { execute: vi.fn().mockResolvedValue({ subscriptionId: "sub-test-123" }) },
  };
  const merged = { ...defaults, ...overrides };
  return {
    createTenant: merged.createTenant as unknown as CreateTenantUseCase,
    addMember: merged.addMember as unknown as AddMemberUseCase,
    removeMember: merged.removeMember as unknown as RemoveMemberUseCase,
    repository,
    createInitialSubscription: merged.createInitialSubscription as unknown as CreateInitialSubscriptionUseCase,
  };
}

// ─── テスト ───────────────────────────────────────────────────────────────────

describe("clerkWebhookHandler", () => {
  let repository: InMemoryTenantRepository;

  beforeEach(() => {
    repository = new InMemoryTenantRepository();
    svixVerifyShouldFail = false;
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = MOCK_SIGNING_SECRET;
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  });

  // ─── organization.created ─────────────────────────────────────────────────

  describe("organization.created", () => {
    it("CreateTenantUseCase.execute が呼ばれ 200 を返す", async () => {
      const createTenantExecute = vi.fn().mockResolvedValue({ tenantId: "uuid-123" });
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc123", name: "山田会計", created_by: "user_owner001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(createTenantExecute).toHaveBeenCalledOnce();
      expect(createTenantExecute).toHaveBeenCalledWith({
        clerkOrganizationId: "org_abc123",
        name: "山田会計",
        initialOwnerClerkUserId: "user_owner001",
      });
    });

    it("organization.created で CreateInitialSubscriptionUseCase も呼ばれる", async () => {
      const createTenantExecute = vi.fn().mockResolvedValue({ tenantId: "uuid-tenant-abc" });
      const createInitialSubscriptionExecute = vi.fn().mockResolvedValue({ subscriptionId: "sub-abc" });
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
        createInitialSubscription: { execute: createInitialSubscriptionExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc123", name: "山田会計", created_by: "user_owner001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(createInitialSubscriptionExecute).toHaveBeenCalledOnce();
      expect(createInitialSubscriptionExecute).toHaveBeenCalledWith({
        tenantId: TenantId.from("uuid-tenant-abc"),
      });
    });

    it("CreateInitialSubscriptionUseCase が失敗した場合 500 を返す (Clerk に retry を促す)", async () => {
      const createTenantExecute = vi.fn().mockResolvedValue({ tenantId: "uuid-tenant-def" });
      const createInitialSubscriptionExecute = vi.fn().mockRejectedValue(
        new Error("Supabase connection error"),
      );
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
        createInitialSubscription: { execute: createInitialSubscriptionExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc123", name: "山田会計", created_by: "user_owner001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  // ─── organizationMembership.created ──────────────────────────────────────

  describe("organizationMembership.created", () => {
    it("リポジトリから Tenant を引き AddMemberUseCase.execute が呼ばれる", async () => {
      // Arrange: Tenant を repository に先に登録する
      const { Tenant } = await import("../../domain/models/Tenant");
      const { TenantName } = await import("../../domain/valueObjects/TenantName");
      const { ClerkOrganizationId } = await import("../../domain/valueObjects/ClerkOrganizationId");

      const tenant = Tenant.create(
        TenantName.from("テスト会計"),
        ClerkOrganizationId.from("org_test_org"),
      );
      await repository.save(tenant);

      const addMemberExecute = vi.fn().mockResolvedValue(undefined);
      const deps = buildMockDeps(repository, {
        addMember: { execute: addMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organizationMembership.created",
        data: {
          organization: { id: "org_test_org" },
          public_user_data: { user_id: "user_new_member" },
          role: "org:member",
        },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(addMemberExecute).toHaveBeenCalledOnce();
      expect(addMemberExecute).toHaveBeenCalledWith({
        tenantId: tenant.id.value,
        userClerkId: "user_new_member",
        role: "member",
      });
    });

    it("org:admin ロールは domain の admin にマップされる", async () => {
      const { Tenant } = await import("../../domain/models/Tenant");
      const { TenantName } = await import("../../domain/valueObjects/TenantName");
      const { ClerkOrganizationId } = await import("../../domain/valueObjects/ClerkOrganizationId");

      const tenant = Tenant.create(
        TenantName.from("管理者テスト会計"),
        ClerkOrganizationId.from("org_admin_org"),
      );
      await repository.save(tenant);

      const addMemberExecute = vi.fn().mockResolvedValue(undefined);
      const deps = buildMockDeps(repository, {
        addMember: { execute: addMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organizationMembership.created",
        data: {
          organization: { id: "org_admin_org" },
          public_user_data: { user_id: "user_admin" },
          role: "org:admin",
        },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(addMemberExecute).toHaveBeenCalledWith(
        expect.objectContaining({ role: "admin" }),
      );
    });

    it("未知のロールは member にフォールバックされる", async () => {
      const { Tenant } = await import("../../domain/models/Tenant");
      const { TenantName } = await import("../../domain/valueObjects/TenantName");
      const { ClerkOrganizationId } = await import("../../domain/valueObjects/ClerkOrganizationId");

      const tenant = Tenant.create(
        TenantName.from("フォールバックテスト"),
        ClerkOrganizationId.from("org_fallback"),
      );
      await repository.save(tenant);

      const addMemberExecute = vi.fn().mockResolvedValue(undefined);
      const deps = buildMockDeps(repository, {
        addMember: { execute: addMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organizationMembership.created",
        data: {
          organization: { id: "org_fallback" },
          public_user_data: { user_id: "user_unknown_role" },
          role: "org:unknown_role",
        },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(addMemberExecute).toHaveBeenCalledWith(
        expect.objectContaining({ role: "member" }),
      );
    });
  });

  // ─── organizationMembership.deleted ──────────────────────────────────────

  describe("organizationMembership.deleted", () => {
    it("RemoveMemberUseCase.execute が呼ばれる", async () => {
      const { Tenant } = await import("../../domain/models/Tenant");
      const { TenantName } = await import("../../domain/valueObjects/TenantName");
      const { ClerkOrganizationId } = await import("../../domain/valueObjects/ClerkOrganizationId");

      const tenant = Tenant.create(
        TenantName.from("削除テスト会計"),
        ClerkOrganizationId.from("org_del_test"),
      );
      await repository.save(tenant);

      const removeMemberExecute = vi.fn().mockResolvedValue(undefined);
      const deps = buildMockDeps(repository, {
        removeMember: { execute: removeMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organizationMembership.deleted",
        data: {
          organization: { id: "org_del_test" },
          public_user_data: { user_id: "user_to_remove" },
          role: "org:member",
        },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(removeMemberExecute).toHaveBeenCalledOnce();
      expect(removeMemberExecute).toHaveBeenCalledWith({
        tenantId: tenant.id.value,
        userClerkId: "user_to_remove",
      });
    });
  });

  // ─── organization.updated ─────────────────────────────────────────────────

  describe("organization.updated", () => {
    it("未対応のため UseCase を呼ばず 200 を返す", async () => {
      const createTenantExecute = vi.fn();
      const addMemberExecute = vi.fn();
      const removeMemberExecute = vi.fn();
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
        addMember: { execute: addMemberExecute },
        removeMember: { execute: removeMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.updated",
        data: { id: "org_abc", name: "新しい名前", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(createTenantExecute).not.toHaveBeenCalled();
      expect(addMemberExecute).not.toHaveBeenCalled();
      expect(removeMemberExecute).not.toHaveBeenCalled();
    });
  });

  // ─── 未知のイベント type ──────────────────────────────────────────────────

  describe("未知のイベント type", () => {
    it("200 を返し UseCase を呼ばない", async () => {
      const createTenantExecute = vi.fn();
      const addMemberExecute = vi.fn();
      const removeMemberExecute = vi.fn();
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
        addMember: { execute: addMemberExecute },
        removeMember: { execute: removeMemberExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "user.created",
        data: { id: "user_123" },
      });

      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(createTenantExecute).not.toHaveBeenCalled();
      expect(addMemberExecute).not.toHaveBeenCalled();
      expect(removeMemberExecute).not.toHaveBeenCalled();
    });
  });

  // ─── Svix 署名検証失敗 ────────────────────────────────────────────────────

  describe("Svix 署名検証失敗", () => {
    it("400 を返す", async () => {
      svixVerifyShouldFail = true;
      const deps = buildMockDeps(repository);
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc", name: "テスト", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid signature");
    });
  });

  // ─── Svix ヘッダー欠損 ────────────────────────────────────────────────────

  describe("Svix ヘッダー欠損", () => {
    it("svix-id が欠けると 400 を返す", async () => {
      const deps = buildMockDeps(repository);
      const handler = createClerkWebhookHandler(deps);

      const req = new Request("http://localhost/api/webhooks/clerk", {
        method: "POST",
        headers: {
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,test_signature",
          "content-type": "application/json",
        },
        body: JSON.stringify({ type: "organization.created", data: {} }),
      });

      const res = await handler(req);

      expect(res.status).toBe(400);
    });
  });

  // ─── zod バリデーション失敗 ───────────────────────────────────────────────

  describe("ペイロードの zod バリデーション失敗", () => {
    it("organization.created でデータフィールドが欠けると 400 を返す", async () => {
      const deps = buildMockDeps(repository);
      const handler = createClerkWebhookHandler(deps);

      // name フィールドが欠けた不正ペイロード
      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid payload");
    });
  });

  // ─── UseCase が DomainError を投げる ─────────────────────────────────────

  describe("UseCase が DomainError を投げる", () => {
    it("400 を返す (同じペイロードの retry 防止)", async () => {
      const createTenantExecute = vi
        .fn()
        .mockRejectedValue(new DomainError("Invalid org id format"));
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc", name: "テスト会計", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid org id format");
    });
  });

  // ─── UseCase が ApplicationError を投げる ─────────────────────────────────

  describe("UseCase が ApplicationError を投げる", () => {
    it("400 を返す", async () => {
      const addMemberExecute = vi
        .fn()
        .mockRejectedValue(new ApplicationError("Tenant not found: uuid-999"));
      const deps = buildMockDeps(repository, {
        addMember: { execute: addMemberExecute },
      });

      // Tenant を repository に先に登録する
      const { Tenant } = await import("../../domain/models/Tenant");
      const { TenantName } = await import("../../domain/valueObjects/TenantName");
      const { ClerkOrganizationId } = await import("../../domain/valueObjects/ClerkOrganizationId");
      const tenant = Tenant.create(
        TenantName.from("エラーテスト会計"),
        ClerkOrganizationId.from("org_error_test"),
      );
      await repository.save(tenant);

      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organizationMembership.created",
        data: {
          organization: { id: "org_error_test" },
          public_user_data: { user_id: "user_error" },
          role: "org:member",
        },
      });

      const res = await handler(req);

      expect(res.status).toBe(400);
    });
  });

  // ─── UseCase が予期しないエラーを投げる ──────────────────────────────────

  describe("UseCase が予期しないエラー (Supabase 接続エラー等) を投げる", () => {
    it("500 を返す (Clerk の retry を促す)", async () => {
      const createTenantExecute = vi
        .fn()
        .mockRejectedValue(new Error("Connection refused"));
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc", name: "テスト会計", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });
  });

  // ─── 機微情報の漏洩防止 ─────────────────────────────────────────────────

  describe("エラーレスポンスに Webhook ペイロードが含まれない", () => {
    const SECRET_USER_ID = "user_super_secret_001";
    const SECRET_ORG_ID = "org_super_secret_001";

    it("予期しないエラー時にペイロード由来の値を含まない", async () => {
      const createTenantExecute = vi
        .fn()
        .mockRejectedValue(new Error(`DB error for ${SECRET_USER_ID}`));
      const deps = buildMockDeps(repository, {
        createTenant: { execute: createTenantExecute },
      });
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: {
          id: SECRET_ORG_ID,
          name: "テスト",
          created_by: SECRET_USER_ID,
        },
      });

      const res = await handler(req);
      const bodyText = JSON.stringify(await res.json());

      expect(res.status).toBe(500);
      expect(bodyText).not.toContain(SECRET_USER_ID);
      expect(bodyText).not.toContain(SECRET_ORG_ID);
      expect(bodyText).not.toContain("DB error");
    });
  });

  // ─── 環境変数未設定 ───────────────────────────────────────────────────────

  describe("CLERK_WEBHOOK_SIGNING_SECRET 未設定", () => {
    it("500 を返す", async () => {
      delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
      const deps = buildMockDeps(repository);
      const handler = createClerkWebhookHandler(deps);

      const req = makeRequest({
        type: "organization.created",
        data: { id: "org_abc", name: "テスト", created_by: "user_001" },
      });

      const res = await handler(req);

      expect(res.status).toBe(500);
    });
  });
});
