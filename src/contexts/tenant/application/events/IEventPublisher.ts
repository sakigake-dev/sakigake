import type { DomainEvent } from "../../domain/events/DomainEvent";

export interface IEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
