import type { DomainEvent } from "../../../domain/events/DomainEvent";
import type { IEventPublisher } from "../../events/IEventPublisher";

/**
 * UseCase テスト専用の in-memory IEventPublisher 実装。
 * publish された events を配列に記録し、テストからアサーション可能にする。
 * Production コードから import してはならない。
 */
export class InMemoryEventPublisher implements IEventPublisher {
  private _publishedEvents: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this._publishedEvents.push(...events);
  }

  get publishedEvents(): readonly DomainEvent[] {
    return this._publishedEvents;
  }

  clear(): void {
    this._publishedEvents = [];
  }
}
