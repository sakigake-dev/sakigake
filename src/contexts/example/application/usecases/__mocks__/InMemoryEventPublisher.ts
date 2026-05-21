import type { IEventPublisher } from "../../events/IEventPublisher";
import type { DomainEvent } from "../../../domain/events/DomainEvent";

/**
 * テスト用 InMemory EventPublisher。
 * publish された Events を配列で蓄積し、テストで assert できる。
 */
export class InMemoryEventPublisher implements IEventPublisher {
  publishedEvents: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }

  clear(): void {
    this.publishedEvents = [];
  }
}
