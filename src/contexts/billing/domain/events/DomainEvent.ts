/**
 * billing context の DomainEvent 基底インターフェース。
 *
 * 設計判断: tenant context の DomainEvent と同一の構造だが、コンテキスト間の
 * 結合を避けるためにコピーを置く方針 (Plan 002 R-04 と同じ判断)。
 * 3コンテキスト以上が参照するようになった時点で src/shared/domain/DomainEvent.ts
 * への昇格を検討する。
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
}
