# ZINE

> 文化的活動が流れ、蓄積され、議論され、記録されるSNS

映画・音楽・文学・美術・ファッション・展示・舞台・ゲーム。
短文投稿、長文記事、レビュー、掲示板スレッド、鑑賞記録 — すべてがひとつのタイムラインに流れ込みます。

設計の全体像は **[DESIGN.md](./DESIGN.md)** を参照してください。

## 動かし方

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。`/` がランディング、`/home` がメインのタイムラインです。

## いまの状態(実装フェーズ)

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | 基盤・デザインシステム・AppLayout | ✅ 完了 |
| 2 | Timeline First(feed_items + 7タブ + 6種カード) | ✅ 完了 |
| 3 | レビュー(星 + 自由評価軸 + 五角形グラフ + テンプレート) | ✅ UI完了 |
| 4 | 鑑賞記録(ステータス + ログ + カレンダー + 統計 + 目標) | ✅ UI完了 |
| 5 | 長文記事(エディタ + 詳細 + 関連作品) | ✅ UI完了 |
| 6 | 掲示板(板 + スレ + レス + 匿名切替 + 引用返信) | ✅ UI完了 |
| 7 | Supabase連携(Auth / DB / Storage / RLS / CRUD) | ✅ 完了 |
| 8 | 品質向上(a11y / OGP / PWA / SEO / デプロイ準備) | ✅ 完了 |

**動作モードは2つあり、自動で切り替わります。**

- **モックモード**(デフォルト): 環境変数なしで起動すると `src/lib/mock-data.ts` のダミーデータで全画面が動く
- **Supabaseモード**: `.env.local` にSupabaseのキーを設定すると、認証・投稿・レビュー・記録・スレッド・記事・フォロー・アバター画像がすべて実際に保存される

## ディレクトリの読み方

```
src/
├── app/(app)/        # 画面。URLとフォルダが1:1対応
├── components/       # 部品。timeline/ がZINEの心臓部
├── lib/
│   ├── types.ts      # 全ドメイン型(DBスキーマと対応)
│   ├── data.ts       # データアクセス層 ← Phase 7 でここだけSupabaseに差し替える
│   ├── mock-data.ts  # ダミーデータ
│   ├── review-templates.ts / record-status.ts
└── supabase/schema.sql  # テーブル定義 + RLS + feed_itemsトリガー
```

**重要なルール**: 画面から `mock-data.ts` を直接 import しない。必ず `lib/data.ts` の関数を経由する。
これが「ダミーデータから始めても破綻しない」ための唯一の規約です。

## Supabaseモードを有効にする手順

1. [supabase.com](https://supabase.com) で無料プロジェクトを作成
2. ダッシュボードの **SQL Editor** で次の3ファイルを順に実行する
   1. `supabase/schema.sql`(テーブル + RLS + feed_itemsトリガー + サインアップトリガー)
   2. `supabase/seed.sql`(掲示板カテゴリ・作品・評価軸テンプレートの初期データ)
   3. `supabase/storage.sql`(アバター画像用バケットとポリシー)
3. `.env.example` を `.env.local` にコピーし、**Settings > API** の値を貼り付ける
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. `npm run dev` を再起動 → `/login` から新規登録(メール+パスワード)

   ※ すぐ試したい場合は、Supabaseの **Authentication > Providers > Email** で
   「Confirm email」をオフにするとメール確認なしでログインできます。

### 仕組みのポイント

- 投稿やレビューをINSERTすると、DBトリガー(`push_to_feed`)が自動で `feed_items` に行を追加し、タイムラインに流れる。アプリ側で二重書き込みする必要はない
- サインアップすると、DBトリガー(`handle_new_user`)が `profiles` / `user_settings` / `streaks` を自動作成する
- 書き込みはすべて `src/lib/actions.ts`(Server Actions)経由。RLSが「本人しか書けない・非公開は本人しか読めない」を保証する
- 読み取りはすべて `src/lib/data.ts` 経由。環境変数の有無で Supabase / モックを自動で切り替える

## Vercelにデプロイする

1. このリポジトリをGitHubにpushする
   ```bash
   git remote add origin https://github.com/<あなたのアカウント>/zine.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) で「Add New > Project」→ リポジトリを選択(設定はデフォルトのままでOK)
3. **Environment Variables** に以下を設定
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`(Supabaseモードにする場合)
   - `NEXT_PUBLIC_SITE_URL` = デプロイ後のURL(例: `https://zine.vercel.app`)— OGP・サイトマップに使われる
4. Deploy を押す。以後 `git push` のたびに自動デプロイされる

※ 環境変数を設定しなければ、本番でもモックモードのデモとして動きます。

## Phase 8 で入っている品質対応

- **SEO/OGP**: 全ページの`metadata`、作品/記事/スレッド/プロフィールの動的OGP、`/opengraph-image`(自動生成)、`robots.txt`、`sitemap.xml`
- **PWA準備**: `manifest.webmanifest` とアイコン(`/icon`, `/apple-icon` をコードから生成。画像ファイル不要)。スマホで「ホーム画面に追加」可能
- **アクセシビリティ**: スキップリンク、`aria-current`/`aria-label`、`prefers-reduced-motion` 対応、コントラスト調整
- **アニメーション**: フィードカードの控えめな入場フェードのみ(OS設定で無効化される)

## 技術スタック

Next.js 15 (App Router) / TypeScript / Tailwind CSS v4 / Recharts / React Hook Form + Zod / next-themes / Supabase(予定) / Vercel(予定)
