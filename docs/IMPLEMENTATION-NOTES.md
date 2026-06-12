# 実装と設計書v1.1の差分メモ

`docs/DESIGN.md`(v1.1)に対する、現実装の意図的な差分と進捗を記録する。
v1.1 §3-2の注記「既に実装済みの場合は実装側を正とする」に基づく判断を含む。

## 実装側を正とした点

| 項目 | 設計書v1.1 | 実装 | 理由 |
|---|---|---|---|
| 投稿モデル | posts 1テーブル+type | posts / articles / reviews / record_sessions / threads の分離 + **feed_items**(タイムライン供給線) | v1.0期に実装済みで安定動作。feed_items により全活動タイプが統一的にタイムラインへ流れる。新タイプ追加は「テーブル+カード+enum」で可能 |
| タイムライン供給 | クエリで posts を直読 | feed_items への供給DBトリガー(push_to_feed) | 「通知トリガー禁止」の趣旨(不可視の魔術回避)は通知側で遵守。feed供給は単純なINSERT複製で局所的 |
| デザイントークン | §3-2の新値(明朝中心) | 実装済みトークン+ゴシック体 | §3-2注記+ユーザー明示指示(明朝体ではなく洗練されたゴシックへ) |
| テーブル名 | work_records / activity_logs | records / record_sessions | 実装済み名を継続。意味は同一(records=本棚、record_sessions=時間ログ) |

## v1.1準拠に変更した点(2026-06-12)

- ✅ 判断1相当: works UPDATE = created_by or moderator(RLS)
- ✅ 判断2: profiles.role('user'/'moderator'/'admin')+ is_moderator()。moderators テーブル廃止
- ✅ 判断3: posts/comments/threads/thread_replies に deleted_at(論理削除)。レスは「削除済み」表示
- ✅ 判断4: 星評価を records(本棚)に一本化。reviews.rating 廃止。平均評価=本棚の星の平均
- ✅ 判断5: 通知はServer Action生成(v1.0実装時から準拠)
- ✅ 判断6: boards 廃止。threads.work_id NOT NULL、語り場は作品ページから
- ✅ 判断7: 匿名投稿UIを廃止(ハンドル制)。anon_id 生成式は将来用に §6-6 のまま
- ✅ 判断8: follows を多態化(人/作品/タグ、num_nonnulls=1)。作品フォローボタン実装
- ✅ 判断9: scripts/seed-tmdb.ts・seed-openbd.ts(service_role は scripts/.env のみ)
- ✅ 判断10: UIカテゴリ=映画+文学(ACTIVE_CATEGORIES)。スキーマは全カテゴリ保持
- ✅ 判断11: record_sessions(時間ログ)の既定visibility=private。records(本棚)=public
- ✅ /welcome オンボーディング(10作品に星)
- ✅ pg_trgm 拡張+GINインデックス
- ✅ works.merged_into_id / title_kana / external_ids
- ✅ collections / collection_items スキーマ(UIはPhase 5)
- ✅ レス番号採番: DB関数 post_thread_reply()(単一トランザクション)
- ✅ reports.handled_by

## 2026-06-12 追加実装(Phase 4 完了・Phase 5 前進)

- ✅ /about: 利用規約・プライバシーポリシー・通報窓口の簡易版+TMDB帰属表示(§6-5)。
  サイドバーのフッターから到達。友人公開の条件を満たした
- ✅ 月間総括カード(Phase 4 完了): /records/stats に表示。集計は lib/recap.ts の
  純粋関数(年間総括 Phase 7 で月→年に拡張して再利用)。プレビューはDOM、
  保存はcanvas描画でPNG。色・フォントは実行時にCSS変数から読む(hex直書きなし)
- ✅ コレクションUI(Phase 5): /collections・/collections/new・/collections/[id]。
  作品ページに「この作品を含むコレクション」+追加フォーム、プロフィールに
  コレクションタブ。作品の追加は作品ページから行う導線(コレクション詳細での
  作品検索は持たない)。collection_items.position は所有者しか書かないため
  件数採番(レス番号の単一トランザクション規約はスレッド専用)
- ✅ タグフォローUI(Phase 5): /tags/[name](タグの活動一覧+フォローボタン)。
  toggleTagFollow が tags 行を必要時に作成 → follows.tag_id の多態フォロー。
  TagBadge・トレンド・検索チップのリンク先は /tags/ へ。フォロー中のタグは
  フォロー一覧ページに表示。タグの活動一覧は posts/reviews/articles の
  tags 配列 → feed_items(fetchFeed の sourceIds オプション)

## 未着手(v1.1ロードマップ)

- 安全三点セット(CAPTCHA/連投制限/NGワード)— Phase 6 一般公開前
- 「一冊に編む」zines / 年間総括 / リポストのフィード表示 — Phase 7
- タグフォローを「フォロー中」タイムラインに反映(現状は人のフォローのみ)
- Playwrightスモークテスト
