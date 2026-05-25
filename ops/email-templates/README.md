# Email Templates

Sakigake 顧客対応で使うメールテンプレ。Gmail / Apple Mail のテンプレ機能に保存して quick insert で使う。

## 利用フロー

```
01-payment-request.md  ← Tally Automation で自動送信(後述)
02-onboarding.md       ← 決済確認後、手動送信
03-reminder.md         ← 48h 経過後の未決済者向け、任意
```

## Tally Automation 連動

`01-payment-request.md` は Tally の Email Automation で自動送信できる。
Tally の Automations 設定で、本テンプレの本文をコピペし、`{{変数}}` を Tally の変数 (`{{name}}`, `{{email}}` etc.) に差し替える。

設定手順:
1. tally.so → 該当フォーム → **Automations** タブ
2. Trigger: `On form submission`
3. Action: `Send an email`
4. To: `{{email}}`(Tally のフォーム変数)
5. Subject / Body をテンプレ 01 からコピペ、変数を Tally 変数に置換
6. テスト送信 → 自分宛に届くことを確認

これで「申込 → 決済リンク送付」が 0 秒で自動化される。

## 各テンプレの利用タイミング

| ファイル | タイミング | 送信主体 |
|---|---|---|
| `01-payment-request.md` | Tally フォーム送信直後 | Tally Automation(自動) |
| `02-onboarding.md` | Stripe で決済確認後 | TKDR(手動、~3 分) |
| `03-reminder.md` | 申込から 48h 経過、決済未確認 | TKDR(手動、任意) |

## TKDR の運用 Tips

- メアドからの返信を促す(`Reply-To` が機能する設定にする)
- 件名のプレフィックス `[Sakigake]` で受信側のフィルタが効きやすい
- 03 のリマインダーは強引にならないトーンが大事(柔軟対応のオファー含める)
- 顧客の GitHub username 取得忘れ防止のため、Tally フォームで required にしておく(設定済の前提)

## 将来の自動化(Phase B 以降)

- Stripe Webhook → 決済完了で自動 onboarding(現状はメール手動送信)
- GitHub API 経由で collaborator invite を自動化(現状は GitHub UI 操作)
- これらは累計 50 件超えてから着手する想定。それまでは手動で十分回る。
