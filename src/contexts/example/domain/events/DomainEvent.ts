/**
 * Domain Event の基底クラス。
 *
 * Aggregate が状態を変える際に発行される事実 (過去形で命名: Created / Renamed / Archived...)。
 * Application 層の UseCase が `aggregate.pullDomainEvents()` で取り出し、
 * EventPublisher 経由で副作用 (通知、他 context 連携等) を起動する。
 */
export abstract class DomainEvent {
  readonly occurredAt: Date;

  constructor() {
    this.occurredAt = new Date();
  }

  abstract get eventName(): string;
}
