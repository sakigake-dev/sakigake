import type { DomainEvent } from "../../domain/events/DomainEvent";

/**
 * billing context Application 層のイベントパブリッシャーインターフェース。
 *
 * 設計判断: tenant context の IEventPublisher と同一の構造だが、コンテキスト間の
 * 結合を避けるためにコピーを置く方針 (Plan 002 R-04)。
 * 将来 shared kernel 化する候補。3コンテキスト以上が参照するようになった時点で
 * src/shared/application/IEventPublisher.ts への昇格を検討する。
 *
 * 現フェーズでは同期的なイベント配信 (直接呼び出し) のみを想定する。
 * Recording context で Inngest を導入する際に非同期 EventBus に差し替える。
 */
export interface IEventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}
