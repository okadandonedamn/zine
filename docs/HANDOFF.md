# ZINE handoff for Claude Code

作成日: 2026-06-15

## 2026-06-15 追記: このフェーズは実装済み

このファイルに書いた「リポスト・引用のフィード表示の本格整理」は実装済みです。

- `types=post` は `post` / `quote` / `repost` を含むようになりました。
- Supabase モードでは `quote` が `posts.quoted_feed_item_id` から引用元 `feed_items` を解決します。
- `toggleRepost` は `reposts` table と `feed_items(item_type='repost')` を同期して作成/削除します。
- mock モードにも `REPOST` サンプルを追加済みです。
- `npm run build` は通過済みです。
- `npm run test:e2e` は 12 本通過済みです。
- in-app browser で `http://localhost:3100/home?feed=latest&types=post` を確認し、`REPOST` と `QUOTE` の表示を確認済みです。

2026-06-15 追記その2:

- CAPTCHA / Turnstile のアプリ側実装を追加しました。`NEXT_PUBLIC_TURNSTILE_SITE_KEY` がある場合、`/login` で Turnstile token を取得し、Supabase Auth の `captchaToken` に渡します。
- トレンドタグは固定値ではなく、mock/Supabase の実データから集計するようにしました。
- おすすめタイムラインは、フォロー中ユーザー、作品、タグ、記録カテゴリ、トレンドタグ、反応量、鮮度を使ってスコアリングします。
- 残るのはコード実装ではなく、公開運用時の Supabase Dashboard 側 CAPTCHA 有効化と Cloudflare Turnstile secret key 設定です。

このファイルは、Claude Code に現在の ZINE プロジェクトを引き継ぐための現状メモです。

## 作業場所

- 実際の作業ディレクトリ: `C:\Users\itari\ZINE`
- 環境コンテキストに `C:\Users\itari\Documents\ZINE` が出ることがありますが、現在のリポジトリは `C:\Users\itari\ZINE` です。
- ルートで実行すること:
  - `cd C:\Users\itari\ZINE`
  - `npm install`
  - 開発サーバー: `npm run dev -- --port 3100`
  - ビルド確認: `npm run build`
  - E2E: `npm run test:e2e`

## 直近の既知正常状態

以下は、リポスト・引用フェーズに入る前に確認済みです。

- `/home` は 3 種類のタイムラインに整理済み:
  - フォロー中
  - 最新
  - おすすめ
- `/home?feed=latest&types=post,review,record` のように、5 機能フィルタを URL クエリで保持済み。
- 5 機能ページにも共通 `TimelineSurface` を導入済み:
  - `/posts`
  - `/articles`
  - `/reviews`
  - `/records`
  - `/threads`
- `/records/new` はラフ記録 / エキスパートモードの 2 モード化済み。
- `/records/[id]` と `/records/stats`、`/records/recap` まわりも追加・更新済み。
- 左ナビは、左上に短文/記事/レビュー/記録/語り場、下中央にホーム/検索/通知、左下に細かい記録欄という方向で整理済み。
- その時点では `npm run build` と `npm run test:e2e` が通っていました。

## 現在の未コミット状態

ワークツリーには、上記フェーズの変更が大量に未コミットで残っています。`git reset` や `git checkout --` で戻さないでください。

確認コマンド:

```powershell
git status --short
```

## 今進めようとしていた次フェーズ

`docs/IMPLEMENTATION-NOTES.md` と `docs/DESIGN.md` の未実装メモから、次フェーズは以下と判断しました。

> リポスト・引用のフィード表示の本格整理

目的:

- `quote` は短文投稿の一種として `types=post` に含める。
- `repost` も短文投稿系の活動として `types=post` に含める。
- Supabase モードでも引用元・リポスト元を破綻なく表示する。
- mock モードでも UI 確認できるようにする。

## 重要: 現在は途中編集あり

この handoff 作成直前に、リポスト・引用フェーズの途中編集が少し入っています。

編集済み:

- `src/lib/types.ts`
  - `QuotedFeedPreview` を追加。
  - `FeedItem` に `{ type: "repost"; reposted: FeedItem }` を追加。
  - `quote.quoted` を `QuotedFeedPreview` に変更。
- `src/lib/data.ts`
  - `TIMELINE_TYPE_TO_FEED_TYPES.post` を `["post", "quote", "repost"]` に変更。
  - `fetchFeed` に `depth?: number` を追加。
  - 引用元とリポスト元を再帰的に取得する途中ブロックを追加。

未完了のため、現時点では `npm run build` が失敗する可能性があります。特に `src/lib/data.ts` で `toQuotedFeedPreview` が未定義です。

Claude Code 側では、最初に以下を確認してください。

```powershell
npm run build
```

失敗したら、まず下の「実装案」の 1〜3 を完了してください。

## 実装案

### 1. `FeedItem` の補助関数を追加する

`src/lib/data.ts` に以下のような helper を追加します。

- `feedItemHref(item: FeedItem): string`
  - post / quote / repost: `/posts/${item.id}`
  - review: 将来詳細ページがなければ `/posts/${item.id}` でも可
  - record: `/records/${item.record.id}`
  - article: `/articles/${item.article.id}`
  - thread: `/threads/${item.thread.id}`
- `toQuotedFeedPreview(item: FeedItem): QuotedFeedPreview`
  - post / quote: `item.post.body`
  - review: `item.review.body`, `workTitle: item.work.title`
  - record: `item.record.memo ?? item.record.comment ?? ""`, `workTitle: item.work.title`
  - article: `item.article.excerpt || item.article.title`
  - thread: `item.thread.body || item.thread.title`, `workTitle: item.work.title`
  - repost: `toQuotedFeedPreview(item.reposted)`

壊れた引用元用に `deleted: true` の preview を返す fallback も用意すると安全です。

### 2. `fetchFeed` の mapping を完成させる

`src/lib/data.ts` の `for (const r of rows)` 内を更新します。

- `r.item_type === "post"` は従来通り `type: "post"`。
- `r.item_type === "quote"` は `type: "quote"` として push する。
  - `posts.get(r.source_id)` の `quoted_feed_item_id` を見て、`quotedById` から preview を取る。
  - 見つからない場合は「引用元を表示できません」の preview を入れる。
- `r.item_type === "repost"` は `repostedById.get(r.source_id)` を見て、存在すれば:

```ts
items.push({
  ...base,
  type: "repost",
  reposted,
});
```

リポスト元が削除・非公開ならスキップでよいです。

### 3. おすすめ・フォロー・タグ検索の helper を `repost` 対応にする

`src/lib/data.ts` の以下を更新します。

- `feedItemTags`
  - `repost` は `feedItemTags(item.reposted)` を返す。
- `feedItemWorkId`
  - `repost` は `feedItemWorkId(item.reposted)` を返す。
- `feedItemCategory`
  - `repost` は `feedItemCategory(item.reposted)` を返す。
- `feedItemEngagement`
  - `repost` は `feedItemEngagement(item.reposted)` に少し加点、またはそのまま継承。

これで、リポストもフォロー中・おすすめ・タグ検索に自然に混ざります。

### 4. UI カードを追加する

追加ファイル案:

- `src/components/timeline/repost-feed-card.tsx`

仕様:

- `typeLabel="REPOST"`。
- `actionText` に「元の活動をリポストしました」程度の表示。
- `counts` は付けないか、最初はリポスト活動自体への反応は無効でもよい。
- 中に `FeedItemRenderer` をそのまま入れると再帰表示できますが、ネストが深くなるので、1 段だけ枠で包む形がよいです。
- `repost` の中身がさらに `repost` の場合は、元の `reposted` をたどるか、簡易表示にする。

更新ファイル:

- `src/components/timeline/feed-item-renderer.tsx`
  - `case "repost": return <RepostFeedCard item={item} />;`
- `src/components/timeline/quote-card.tsx`
  - `quoted.href` があれば引用元 block を `Link` にする。
  - `quoted.typeLabel` と `quoted.workTitle` を表示。
  - `quoted.deleted` のときは控えめな文言にする。

### 5. `toggleRepost` を feed supply 対応にする

現状:

- `src/lib/actions.ts` の `toggleRepost` は `toggleReaction("reposts", ...)` を呼んでいるだけ。
- `reposts` table には行が入るが、`feed_items` に `item_type='repost'` の行を作らない。

変更案:

- `toggleRepost` を専用実装にする。
- 既存 repost がある場合:
  - `reposts` から削除。
  - `feed_items` から `user_id = user.id AND item_type = 'repost' AND source_id = feedItemId` を削除。
- 新規 repost の場合:
  - 対象 `feed_items` を取得して、公開状態だけ許可。
  - `reposts` に insert。
  - `feed_items` に insert:

```ts
{
  user_id: user.id,
  item_type: "repost",
  source_id: feedItemId,
  work_id: item.work_id ?? null,
  visibility: "public",
}
```

- 既存通り `notify(... kind: "repost")` を送る。
- `revalidatePath("/home")` と、必要なら `/posts`, `/profile/...` も revalidate。

### 6. mock-data を追加する

`src/lib/mock-data.ts` の `feedItems` に `type: "repost"` を 1 件追加します。

例:

```ts
{
  id: "f17",
  type: "repost",
  user: users[2],
  createdAt: "2026-06-11T12:30:00+09:00",
  reposted: {
    id: "f1",
    type: "post",
    user: users[1],
    createdAt: "2026-06-11T10:12:00+09:00",
    post: { ... },
  },
}
```

`types=post` で `POST` / `QUOTE` / `REPOST` が混ざって見える状態を目標にします。

### 7. E2E を更新する

`e2e/smoke.spec.ts` に最低限追加します。

- `/home?feed=latest&types=post` を開く。
- `REPOST` が見える。
- `QUOTE` が見える。
- `/posts?feed=latest` でも `REPOST` または `QUOTE` が表示される。

文字化けしている既存テスト名はそのままで構いません。テスト対象は role/text を安定して取れる英字ラベルに寄せると安全です。

### 8. docs を更新する

更新対象:

- `docs/IMPLEMENTATION-NOTES.md`
- `docs/DESIGN.md`

やること:

- 「リポスト・引用のフィード表示の本格整理」を未実装リストから外す。
- `quote` と `repost` は短文投稿フィルタ `post` に含める、と明記。
- `repost` は `reposts` table と `feed_items(item_type='repost')` を同期して供給する、と明記。

残す未実装メモ:

- CAPTCHA / Turnstile
- 年間総括の追加改善
- トレンドタグ・おすすめ強化
- 語り場レスのいいねボタン配線の追加改善

## 注意点

- 画面から直接 Supabase を呼ばない。既存方針通り `src/lib/data.ts` と `src/lib/actions.ts` 経由。
- `feed_items` の供給構造は維持する。
- 公開記録だけタイムラインに流す方針は維持。
- 時間ログ/記録セッションは既定非公開の方針を崩さない。
- 星評価の真実は引き続き `records`。
- 既存未コミット変更を戻さない。

## 推奨作業順

1. `npm run build` で現在のエラーを確認。
2. `src/lib/data.ts` の未定義 helper と `quote/repost` mapping を完成。
3. `RepostFeedCard` と `FeedItemRenderer` を追加。
4. `toggleRepost` を `feed_items` 供給対応に変更。
5. mock の `repost` item を追加。
6. docs と e2e を更新。
7. `npm run build`
8. `npm run test:e2e`
9. ブラウザで `http://localhost:3100/home?feed=latest&types=post` を確認。
