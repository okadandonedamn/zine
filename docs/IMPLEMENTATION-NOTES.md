# 実装と設計書v1.1の差分メモ

## 2026-06-14 タイムライン中心UI改定

- `/home` は `TimelineSurface` を使う中心タイムラインになった。タイムライン種別は `following` / `latest` / `recommended` の3種類。旧 `foryou` は `recommended` として正規化する。
- `/home?feed=latest&types=post,review,record` のように、5機能フィルタをURLクエリで保持する。`types` 未指定時は `post,article,review,record,thread` すべてを表示する。内部の `quote` と `repost` は短文投稿 `post` の表示対象に含める。
- `/posts` `/articles` `/reviews` `/records` `/threads` を追加し、各機能内でも フォロー中 / 最新 / おすすめ を切り替えられるようにした。重複実装は避け、すべて `TimelineSurface` と `getTimeline(feed, { types })` を通す。
- `getTimeline` は mock/Supabase の両方で同じ `TimelineFeed` と `TimelineContentType` を受ける。Supabaseでは `feed_items.visibility = public` を公開タイムラインの条件にした。
- おすすめは簡易スコア実装。フォロー作品・フォロータグ・自分の記録カテゴリ・反応数を加点し、足りない分は最新順で補完する。

## 2026-06-14 記録2モード化

- `/records/new` はラフ記録とエキスパートモードを選べる。ラフ記録は作品、ステータス、日付、ひとことメモ、公開/非公開のみ。エキスパートは既存項目に加えて画像URL、長文コメント、集中度、満足度、再訪したさ、カスタム数値を送信する。
- `record_sessions` に `entry_mode`、`comment`、`image_urls`、`focus_score`、`satisfaction_score`、`revisit_score`、`custom_metrics` を追加する migration-005 を作成した。
- `/records/[id]` を追加し、記録画像、コメント、ログ、数値チャートを表示する。`/records/stats` はラフ記録も件数・カテゴリ統計に含め、エキスパート数値がある場合だけ Recharts の推移グラフを表示する。
- 星評価の真実は引き続き `records.rating`。`record_sessions.visibility` の既定非公開は維持し、公開記録だけがタイムラインへ流れる。

## 2026-06-14 語り場レスいいね配線

- 語り場詳細のレス下部に `ReplyLikeButton` を追加し、`toggleThreadReplyLike` Server Action で `thread_reply_likes` をトグルする。
- `getRepliesForThread` はレスごとの合計 `likes` とログイン中ユーザーの `viewerLiked` を返す。mock モードでは初期状態を未いいねとして返し、ボタン側の楽観更新で画面確認できる。
- Supabase では `thread_reply_likes` の公開 select policy を migration-006 で追加し、合計数を誰でも読めるようにする。insert/delete は既存の self policy を使う。

## 2026-06-14 年間総括

- `/records/recap` を追加し、`?year=2026` のように年指定できる年間総括ページを実装した。未指定時は最新記録の年を使う。
- `lib/recap.ts` に `latestRecordYear` と `buildYearlyRecap` を追加した。月別記録数、合計時間、ページ数、完了作品、カテゴリ、代表感情、平均評価、ラフ/Expert件数を純粋関数で集計する。
- `YearlyRecapCard` は年間総括を一枚カードとして表示し、PNG保存できる。`YearlyRecapChart` は Recharts で月別の記録数/完了数を表示する。
- `/records` `/records/stats` と sitemap から `/records/recap` へ導線を追加した。mock/Supabase の両方で `getRecords()` と `getWorks()` 経由の集計にしている。

## 2026-06-15 リポスト・引用のフィード表示

- 短文投稿フィルタ `post` は内部的に `post` / `quote` / `repost` を含む。`/home?feed=latest&types=post` と `/posts` で通常投稿、引用、リポストが同じ短文系タイムラインとして表示される。
- `quote` は `posts.quoted_feed_item_id` から引用元の `feed_items` を解決し、引用元のユーザー、種別、作品名、本文抜粋、リンクを `QuotedFeedPreview` として表示する。引用元が削除・非公開の場合は代替プレビューを出す。
- `repost` は `reposts` table の反応数だけでなく、`feed_items(item_type='repost', source_id=<元feed_item_id>)` を Server Action で供給する。取り消し時は対応する repost feed item も削除する。
- mock モードにも `REPOST` サンプルを追加し、Supabase 未設定でも引用/リポストの表示を確認できる。おすすめ・フォロー中・タグ検索ではリポスト元のタグ、作品、カテゴリ、反応量を継承する。

## 2026-06-15 CAPTCHA / Turnstile とトレンド・おすすめ強化

- `/login` に Cloudflare Turnstile widget を追加した。`NEXT_PUBLIC_TURNSTILE_SITE_KEY` が設定されている場合はログイン/新規登録前に token を必須にし、Supabase Auth の `options.captchaToken` として送信する。未設定時は既存の開発・mock確認を妨げず、設定案内だけ表示する。
- `.env.example` に `NEXT_PUBLIC_TURNSTILE_SITE_KEY` を追加した。Turnstile secret key と CAPTCHA 有効化は Supabase Dashboard 側の運用設定で行う。
- `getTrendingTags()` は固定 mock ではなく、mock では `feedItems` のタグと反応量、Supabase では `taggings` と `posts` / `reviews` / `articles` / `works` の tags 配列から集計して返す。
- おすすめタイムラインは、反応量に加えてフォロー中ユーザー、フォロー中作品、フォロー中タグ、自分の記録カテゴリ、トレンドタグ、鮮度を加点する。自分の活動は少し減点し、同点時は最新順で補完する。
- 右レールの話題作品・おすすめユーザーも固定先頭ではなく、作品のレビュー/記録/平均評価、ユーザーの follower 数で並べる。

## 今回あえて残した未実装メモ

- 現時点のコード内未実装はなし。公開運用時は Supabase Dashboard で CAPTCHA(Turnstile) を有効化し、Cloudflare 側の secret/site key を設定する。

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
  純粋関数。年間総括は /records/recap で月→年に拡張済み。プレビューはDOM、
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

- ✅ 「フォロー中」タイムラインに多態フォロー三態を反映(2026-06-12):
  人(user_id)・作品(feed_items.work_id)・タグ(フォロー中タグが付いた
  posts/reviews/articles の source_id)を fetchFeed の anyOf(OR条件)で取得。
  記録の feed_items に work_id が無かったため migration-003 で供給トリガーを
  修正+埋め戻し(feed供給トリガーは規約上の許容例外)

- ✅ 通報フロー(Phase 6 前進・2026-06-12): ReportButton(語り場のスレッド/レス、
  理由必須)→ submitReport が reports に積む。/moderation(moderator/admin のみ、
  サイドバーに条件表示)で「対象を削除して対応」(論理削除+status=actioned)
  または「却下」(dismissed)。handled_by を記録。role は profiles.role を
  mapProfile で User.role に載せた(変更はDBダッシュボードのみ)。
  モックの currentUser は moderator にして画面確認可能。
  通報対象は当面 thread / thread_reply(ReportTargetType)。posts への拡張は
  feed_items 経由のリンク解決を足せばよい

- ✅ 安全三点セットのうち2つ(2026-06-12): NGワードフィルタ(lib/safety.ts の
  純粋関数。NFKC正規化+空白除去で表記ゆれ吸収。モックモードでも効く)と
  連投制限(actions.ts の checkRateLimit が直近行の created_at を見る。
  秒数は safety.ts の RATE_LIMIT_SECONDS)。短文/レビュー/記事/スレ/レス/
  コメントの6アクションに適用。残るは CAPTCHA(Turnstile)のみで、これは
  Supabase プロジェクト作成時にダッシュボードで有効化する

- ✅ Playwrightスモークテスト(2026-06-13): e2e/smoke.spec.ts に6本
  (タイムライン/書架/Followingのタグ反映/語り場+論理削除表示/
  NGワード拒否/モデレーション画面)。`npm run test:e2e` で実行。
  モックモードの devサーバー(port 3100)を webServer として自動起動。
  モックデータを変えたらテストの期待値も見直すこと

- ✅ 「一冊に編む」zines(Phase 7 着手・2026-06-13): migration-004 で
  zines / zine_items を確定(collections と同型の RLS。item_type は
  article/review のポリモーフィック。草案の post_id 束ねから変更し、
  DESIGN.md §5 に追記済み)。/zines(一覧)・/zines/new(自分の記事+
  レビューをチェックした順に編む)・/zines/[id](表紙・目次・誌面・奥付)。
  PDF書き出しはブラウザ印刷で行い、レイアウトの周辺UIは print:hidden、
  誌面は print:break-before-page で篇ごとに改ページ。冊子の削除は
  物理削除(索引であり本体は残る。コレクションと同じ扱い)

## 運用設定(v1.1ロードマップ)

- CAPTCHA(Turnstile): アプリ側の token 取得と Supabase Auth 送信は実装済み。一般公開前に Supabase Auth 設定で CAPTCHA を有効化し、Cloudflare Turnstile の secret/site key を設定する。
