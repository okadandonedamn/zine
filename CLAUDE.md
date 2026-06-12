# ZINE 開発憲法

設計の地図は `docs/DESIGN.md`(設計書 v1.1)。実装との既知の差分は `docs/IMPLEMENTATION-NOTES.md` に記録する。設計を変えたら必ず両方を更新すること。

## プロジェクト概要

文化系SNS「ZINE」。Next.js 15 (App Router) + TypeScript + Tailwind v4 + Supabase。
Supabase環境変数が無いときはモックデータで全画面が動く(`src/lib/data.ts` が自動切替)。

## コマンド

- `npm run dev` — 開発サーバー
- `npm run build` — ビルド(変更後は必ず通すこと)
- `npm run seed:tmdb` / `npm run seed:openbd` — 作品シード(scripts/。ローカル手動実行のみ)

## データベース規約

- スキーマの正は `supabase/schema.sql`。適用済みDBへの変更は `supabase/migration-XXX-*.sql` を追加する
- 読み取りは `src/lib/data.ts`、書き込みは `src/lib/actions.ts` に集約。画面から直接Supabaseを叩かない
- テーブル作成とRLSポリシーはセット。ポリシーの無いテーブルは「全部見えない」

## v1.1 追加規約

- 星評価は work_records(本テーブル名: records)が唯一の真実。reviews テーブルに rating を持たせない
- 通知は Server Action で作成する。DBトリガーで通知を作らない
  (feed_items への供給トリガーと採番関数のみ例外として可)
- posts / comments / threads / thread_replies の削除は deleted_at による論理削除。
  アプリから物理 DELETE を発行しない。読み取りは lib/data.ts 経由で
  deleted_at is null を徹底する(語り場のレスは行を返し「削除済み」表示)
- works の UPDATE は created_by 本人か moderator のみ(RLSで強制)
- service_role キーは scripts/.env 専用。app/ 以下と .env.local に書いたら設計違反
- 語り場(threads)は必ず作品(work_id)に従属する。独立した板(boards)は作らない
- 匿名投稿は提供しない(ハンドル制)。将来の anon_id 生成式は docs/DESIGN.md §6-6
- UI上の作品カテゴリは当面「映画+文学」のみ(スキーマは全カテゴリ保持)。
  定義は src/lib/types.ts の ACTIVE_CATEGORIES
- レス番号は DB関数 post_thread_reply()(単一トランザクション)で採番する。
  アプリ側で count+1 をしない

## デザイン規約

- デザイントークンは `src/app/globals.css` の @theme のみ。hex直書き禁止
- フォントはゴシック体(Noto Sans JP / Zen Kaku Gothic New)。明朝は使わない(ユーザー指示により確定)
- 影は使わない。区切りは1pxの罫線。過剰なアニメーション禁止(opacityと小さなtranslateのみ)
- 紫青グラデーション、原色バッジ、見出しの絵文字は禁止

## 作業の進め方

- 1機能できたらビルド確認 → コミット
- コミットを求められたら push まで行う(リモート: github.com/okadandonedamn/zine)
