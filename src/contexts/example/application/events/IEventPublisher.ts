import type { DomainEvent } from "../../domain/events/DomainEvent";

/**
 * Domain Events を発行する境界。
 *
 * Domain 層は副作用を持たない (純粋なロジックのみ)。
 * 副作用 (DB 通知、メール送信、他 context 連携等) は Application 層で
 * このインターフェースを通して起動する。
 *
 * 本番実装: Inngest や Postgres LISTEN/NOTIFY 等で publish (ADR-0005 参照)
 * テスト実装: InMemoryEventPublisher で配列に蓄積
 */
export interface IEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
