import type { UserId } from "../valueObjects/UserId";
import type { MemberRole } from "../valueObjects/MemberRole";

export class TenantMembership {
  private _role: MemberRole;

  constructor(
    readonly userId: UserId,
    role: MemberRole,
    readonly createdAt: Date = new Date(),
  ) {
    this._role = role;
  }

  get role(): MemberRole {
    return this._role;
  }

  /**
   * ロールを変更する。
   *
   * @internal Tenant Aggregate Root 経由でのみ呼ぶこと (Tenant.changeMemberRole)。
   * 直接呼び出すと「最低1人の owner」不変条件が破れる危険がある。
   */
  _changeRole(newRole: MemberRole): void {
    this._role = newRole;
  }
}
