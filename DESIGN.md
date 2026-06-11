# ZINE 設計ドキュメント

> 文化的活動が流れ、蓄積され、議論され、記録されるSNS

---

## 1. プロダクトコンセプト整理

ZINEは「作品について語ること」自体を一級の文化的活動として扱うSNSである。

- **流れる**: あらゆる活動(つぶやき・レビュー・記録・記事・スレッド)がタイムラインに流れる
- **蓄積される**: 活動は作品ページ・プロフィール・統計・カレンダーに積み重なる
- **議論される**: 短文の反応から掲示板スレッドまで、深さの異なる議論の階層を持つ
- **記録される**: Studyplus的な鑑賞ログが「文化的生活の日記」になる

量産型SNSとの違いは「対象が作品である」こと。投稿の多くが作品(Work)に紐づき、
人と人だけでなく「人と作品と批評」のネットワークを作る。

## 2. 5機能の関係性

```
            ┌─────────────────────────────┐
            │      X的タイムライン(主軸)      │
            │   すべての活動が流れ込む場所     │
            └──────────────┬──────────────┘
       ┌─────────┬─────────┼─────────┬─────────┐
       │         │         │         │         │
   短文投稿   長文記事    レビュー   鑑賞記録   スレッド
   (瞬間の声) (思想の堆積) (批評の型) (生活の記録) (深い議論)
       │         │         │         │         │
       └─────────┴────┬────┴─────────┴─────────┘
                      │
              ┌───────┴───────┐
              │  作品ページ(Work) │ ← 蓄積のハブ
              └───────────────┘
```

体験の流れ: **観る → 記録する → レビューする → つぶやく → 反応される → スレッドで深掘る → 記事にまとめる**。
各機能は独立アプリではなく、同じ一つの活動の「深さの違い」として設計する。

## 3. なぜタイムラインを主軸にするべきか

1. **発見の入口**: レビューも記録も、誰にも見られなければ蓄積で終わる。タイムラインが「他者の文化的活動を覗く窓」になる
2. **участ障壁の最小化**: 長文記事を書くのは重いが、流れてきたレビューに「いいね」するのは軽い。軽い参加から重い参加への導線を作れる
3. **データ設計が単純になる**: `feed_items` に全活動を正規化して流す設計なら、新しい活動タイプ(例: 目標達成)を後から追加してもタイムラインが自然に対応する
4. **習慣化**: 「開けば何かが流れている」ことがDAUの源泉。記録・レビューは流量が安定している(毎日誰かが何かを観る)ため、純粋な投稿SNSより枯れにくい

## 4. 全体アーキテクチャ

```
[ブラウザ]
   │
[Next.js App Router (Vercel)]
   ├─ Server Components: タイムライン取得・作品ページ(読み取り中心)
   ├─ Client Components: Composer・グラフ・カレンダー(対話中心)
   ├─ Server Actions / Route Handlers: 投稿・記録のCRUD
   │
[Supabase]
   ├─ Auth (メール / OAuth)
   ├─ Postgres (RLS有効)
   │    └─ feed_items を中心に全テーブルが接続
   └─ Storage (アバター・カバー画像)
```

- 現段階(Phase 1〜6)は `src/lib/mock-data.ts` をデータ源にする
- データ取得は `src/lib/data/` のアクセサ関数経由に統一し、Phase 7 で中身だけSupabaseに差し替える
- これにより「ダミーデータから始めるが、後から破綻しない」を実現する

## 5. 推奨技術スタック

| 領域 | 採用 | 理由 |
|---|---|---|
| フレームワーク | Next.js 15 App Router + TypeScript | RSCで読み取り画面が速い・Vercel直結 |
| スタイル | Tailwind CSS v4 | デザイントークンをCSS変数で管理 |
| UI部品 | shadcn/ui方式(自前実装) | コードを所有でき、ZINEの質感に染められる |
| グラフ | Recharts | レーダーチャート・統計グラフ両対応 |
| フォーム | React Hook Form + Zod | 型安全なバリデーション |
| 状態管理 | Zustand(最小限) | グローバル状態はテーマ・Composer程度 |
| BaaS | Supabase | Auth/DB/Storage/RLSが一体 |
| デプロイ | Vercel | |

## 6. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx            # ルート(フォント・テーマ)
│   ├── page.tsx              # ランディング
│   ├── globals.css           # デザイントークン
│   └── (app)/                # アプリ本体(3カラムレイアウト)
│       ├── layout.tsx        # AppLayout
│       ├── home/             # タイムライン(主軸)
│       ├── search/ settings/
│       ├── post/new/ posts/[id]/
│       ├── article/new/ articles/[id]/
│       ├── works/ works/[id]/
│       ├── reviews/new/ reviews/[id]/ review-templates/
│       ├── records/ (+ new, calendar, stats)
│       ├── goals/
│       ├── boards/ boards/[id]/ threads/new/ threads/[id]/
│       └── profile/[username]/ (+ reviews, records, articles)
├── components/
│   ├── ui/        # 汎用部品 (Button, Card, Tabs, Badge...)
│   ├── layout/    # Sidebar, Header, MobileNav, RightRail
│   ├── timeline/  # Timeline, FeedItemRenderer, 各種カード
│   ├── review/    # RadarRatingChart, ReviewAxisEditor, RatingStars
│   ├── record/    # RecordCalendar, RecordStats, GoalCard, StreakBadge
│   ├── work/      # WorkCard, WorkDetailHeader
│   ├── board/     # ThreadCard, ThreadReply
│   └── common/    # UserAvatar, TagBadge, EmptyState...
├── lib/
│   ├── types.ts            # 全ドメイン型(DBスキーマと対応)
│   ├── mock-data.ts        # ダミーデータ(Phase 7でSupabaseに置換)
│   ├── review-templates.ts # カテゴリ別デフォルト評価軸
│   ├── record-status.ts    # カテゴリ別ステータス語彙
│   └── utils.ts            # cn() など
└── supabase/
    └── schema.sql          # テーブル定義 + RLS(Phase 7で適用)
```

## 7. 画面構成

要求された全ルートを実装(詳細は要件どおり)。要点:

- `/home` — 7タブ(For You / Following / Latest / Reviews / Records / Discussions / Articles)。PC 3カラム、モバイル1カラム+下部ナビ+固定投稿ボタン
- `/works/[id]` — 作品の蓄積ハブ。レビュー(大きいレーダーチャート)・記録統計・関連スレッド・関連記事
- `/reviews/new` — 星評価 + 自由評価軸エディタ + リアルタイムレーダープレビュー
- `/records/calendar`・`/records/stats` — Studyplus的な継続の可視化
- `/profile/[username]` — その人の文化的活動の全蓄積

## 8. データベース設計(要約)

完全なDDLは `supabase/schema.sql` を参照。グループ:

- **ユーザー**: `profiles`(auth.usersに1:1), `follows`, `user_settings`
- **タイムライン**: `feed_items`(中心テーブル)
- **投稿**: `posts`, `comments`, `likes`, `bookmarks`, `reposts`
- **記事**: `articles`(draft/publishedをstatusで管理)
- **作品**: `works`, `work_images`, `work_aliases`
- **レビュー**: `reviews`, `review_scores`(軸×点数), `review_axis_templates`, `review_axis_template_items`
- **記録**: `records`(作品×ユーザーの状態), `record_sessions`(個々のログ), `goals`, `goal_progress`, `streaks`
- **掲示板**: `boards`, `threads`, `thread_replies`
- **横断**: `tags`, `taggings`(ポリモーフィック), `notifications`, `reports`

## 9. feed_items を中心にしたタイムライン設計

```sql
create table feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  item_type text not null,  -- post|article|review|record|thread|reply|repost|quote|goal_achievement
  source_id uuid not null,  -- 各テーブルの行を指す(ポリモーフィック)
  work_id uuid references works(id),  -- 作品紐付き活動の高速フィルタ用
  visibility text not null default 'public',
  created_at timestamptz not null default now()
);
```

**仕組み**: 投稿・レビュー・記録などを作成したら、同一トランザクションで `feed_items` に1行追加する(Postgresトリガーで自動化)。タイムラインは `feed_items` を時系列で引き、`item_type` ごとに本体をJOINして表示する。

- タブの実装 = `item_type` と `follows` によるフィルタにすぎない(Reviews タブ = `item_type='review'`)
- 新しい活動タイプの追加 = enum値とカードコンポーネントを1つ足すだけ
- フロント側は `FeedItem` 判別共用体 + `FeedItemRenderer` が `type` でカードを出し分ける

## 10. 自由評価軸レビューの設計

- レビューは「星(0.5〜5)」+「自由な5軸(各1〜10点)」+「本文」の三層
- 軸は `review_scores` に `(review_id, axis_name, score, display_order)` で保存 → 軸名は完全に自由
- テンプレート: カテゴリ別デフォルト(映画=映像/脚本/演技/音楽/余韻 など) + ユーザー保存テンプレート
- UI: テンプレート選択 → 軸名はその場で編集可 → スライダーで採点 → 右にレーダーが即時描画
- 思想: 「批評の型を自分で作る」体験。軸名そのものがその人の批評観を表す

## 11. 五角形レーダーチャートの設計

- Recharts `RadarChart` をラップした `RadarRatingChart` を1つ作り、`size: 'sm' | 'md' | 'lg'` で使い回す
  - `sm`(~120px): タイムラインのレビューカード内。ラベル省略・線のみ
  - `md`(~220px): レビュー詳細
  - `lg`(~300px): 作品ページ・レビュー作成プレビュー
- 色はアクセント1色 + 半透明塗り。グリッドは罫線色で控えめに。ダーク/ライト両対応(CSS変数参照)
- 軸数は5固定(五角形)、スコア域は1〜10

## 12. Studyplus的鑑賞記録の設計

- `records` = 作品との関係(status: want/doing/done/stacked/paused/rewatch)。カテゴリで語彙が変わる(観たい/聴きたい/読みたい/行きたい)
- `record_sessions` = 1回の活動ログ(日時・分数・ページ・話数・曲数・メモ・感情タグ・場所・公開設定)
- 統計はセッションの集計: 週間鑑賞時間・月間本数・カテゴリ別内訳・連続記録日数(streak)
- `goals` = 期間×カテゴリ×目標値。進捗はセッション/レコード集計から算出
- カレンダー: 月グリッドに活動ドット(カテゴリ色)。「続けたくなるが軽薄でない」= 数字と静かなグラフで見せ、バッジや派手な演出は使わない
- 公開セッションのみ `feed_items` に流れる(「Aさんが『花様年華』を観ました」)

## 13. 実装フェーズ

要件どおり Phase 1〜8。本リポジトリの現状:

- **Phase 1〜2(完了)**: デザインシステム、AppLayout、7タブタイムライン、6種のフィードカード
- **Phase 3〜6(UI完了)**: 作品/レビュー/記録/記事/掲示板の全画面をモックデータで実装
- **Phase 7(準備済)**: `supabase/schema.sql` にDDL+RLS。`lib/data/` 経由のデータアクセスを差し替える
- **Phase 8(未)**: アクセシビリティ・OGP・PWA・デプロイ

## 14. 最初に作るべき最小構成

1. デザイントークン(色・フォント・余白) — 世界観の土台
2. AppLayout(3カラム/モバイル1カラム)
3. `FeedItem` 型と `FeedItemRenderer` — Timeline First の核
4. 短文・レビュー・記録の3カードだけのタイムライン
5. レーダーチャート — ZINEの個性

この5つで「ZINEらしさ」が判定できる。残りはすべてこの上への追加。

## 15. 初心者が迷いやすい点

- **Server / Client Components の境界**: グラフ・フォーム・タブは `"use client"`、一覧表示はサーバーのまま。迷ったら「useState/onClickを使うか?」で判定
- **ポリモーフィックな feed_items**: 外部キー制約が張れないことに不安を感じやすいが、トリガーで整合性を守るのが定石
- **RLSの落とし穴**: ポリシーを書き忘れたテーブルは「全部見えない」になる。`select` ポリシーから書く
- **「全部作ってから見せる」病**: タイムラインだけ動く状態を最速で作り、毎日触ること
- **モックデータの捨て方**: コンポーネントから直接 `mock-data` を import せず、必ず `lib/data/` の関数を経由する(ここだけ差し替えればSupabase化できる)

## 16. 将来拡張しやすい理由

- **feed_items の単一供給線**: 新機能(例: コレクション、イベント参加)は「テーブル+カード+enum値」を足すだけでタイムラインに乗る
- **review_scores の行指向設計**: 軸が列でなく行なので、軸数の変更・多言語化・テンプレート市場のような拡張が無修正で可能
- **visibility カラムの統一**: public/private に followers/mutual を後から追加できる(RLSポリシーの条件追加のみ)
- **カードコンポーネントの規約**: すべてのカードが `FeedItem` を受け取る統一インターフェース
- **データアクセス層の分離**: モック→Supabase→(将来)専用API と段階移行できる
