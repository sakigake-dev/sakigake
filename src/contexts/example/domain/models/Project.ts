import { DomainError } from "../errors/DomainError";
import { DomainEvent } from "../events/DomainEvent";
import { ProjectArchived } from "../events/ProjectArchived";
import { ProjectCreated } from "../events/ProjectCreated";
import { ProjectReactivated } from "../events/ProjectReactivated";
import { ProjectRenamed } from "../events/ProjectRenamed";
import type { ProjectDescription } from "../valueObjects/ProjectDescription";
import { ProjectId } from "../valueObjects/ProjectId";
import type { ProjectName } from "../valueObjects/ProjectName";
import { ProjectStatus } from "../valueObjects/ProjectStatus";
import type { TenantId } from "../valueObjects/TenantId";
import type { UserId } from "../valueObjects/UserId";

interface ProjectProps {
  id: ProjectId;
  tenantId: TenantId;
  name: ProjectName;
  description: ProjectDescription;
  status: ProjectStatus;
  ownerId: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Aggregate Root.
 *
 * example context の中核 Aggregate。「Project」という単純なドメインを通じて、
 * Sakigake における Aggregate の書き方を示すリファレンス実装:
 * - private constructor + static factory (create / reconstitute) で生成を制御
 * - 状態を mutator method 内で完結 (外部から直接 set 不可)
 * - 状態遷移ごとに Domain Event を発行
 * - 不変条件 (archived な Project は rename 不可、等) をメソッド内で守る
 *
 * customer はこのファイルを参考に、自分のドメイン (例: Note, Document, Customer, Order)
 * を同じ構造で書ける。
 */
export class Project {
  private domainEvents: DomainEvent[] = [];

  private constructor(private readonly props: ProjectProps) {}

  /**
   * 新規 Project を生成する Factory。
   * 生成時に ProjectCreated イベントを発行する。
   */
  static create(input: {
    tenantId: TenantId;
    name: ProjectName;
    description: ProjectDescription;
    ownerId: UserId;
  }): Project {
    const now = new Date();
    const project = new Project({
      id: ProjectId.generate(),
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      status: ProjectStatus.active(),
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now,
    });

    project.domainEvents.push(
      new ProjectCreated(project.id, project.tenantId, project.name, project.ownerId),
    );

    return project;
  }

  /**
   * 永続化された状態から Project を復元する。
   * Repository (Infrastructure 層) からのみ呼ばれる。復元時にはイベント発行しない。
   */
  static reconstitute(props: ProjectProps): Project {
    return new Project(props);
  }

  // ---------- Getters ----------
  get id(): ProjectId { return this.props.id; }
  get tenantId(): TenantId { return this.props.tenantId; }
  get name(): ProjectName { return this.props.name; }
  get description(): ProjectDescription { return this.props.description; }
  get status(): ProjectStatus { return this.props.status; }
  get ownerId(): UserId { return this.props.ownerId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ---------- Business methods ----------

  /**
   * Project 名を変更。archived の Project は rename 不可。
   * 同じ名前への rename は no-op (イベント発行なし、冪等)。
   */
  rename(newName: ProjectName): void {
    if (this.props.status.isArchived()) {
      throw new DomainError("Cannot rename an archived project.");
    }
    if (this.props.name.equals(newName)) {
      return;
    }
    const oldName = this.props.name;
    this.props.name = newName;
    this.props.updatedAt = new Date();
    this.domainEvents.push(new ProjectRenamed(this.id, oldName, newName));
  }

  /**
   * Project を archive。既に archived ならエラー。
   */
  archive(): void {
    if (this.props.status.isArchived()) {
      throw new DomainError("Project is already archived.");
    }
    this.props.status = ProjectStatus.archived();
    this.props.updatedAt = new Date();
    this.domainEvents.push(new ProjectArchived(this.id));
  }

  /**
   * archived な Project を active に戻す。既に active ならエラー。
   */
  reactivate(): void {
    if (this.props.status.isActive()) {
      throw new DomainError("Project is already active.");
    }
    this.props.status = ProjectStatus.active();
    this.props.updatedAt = new Date();
    this.domainEvents.push(new ProjectReactivated(this.id));
  }

  /**
   * 蓄積された Domain Events を取り出してクリアする。
   * Application 層の UseCase が、save の前に呼び、EventPublisher 経由で publish する。
   */
  pullDomainEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
