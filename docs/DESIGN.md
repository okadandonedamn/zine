# ZINE 設計書 v1.1

## 2026-06-14 改定: タイムライン中心UIと記録2モード化

ZINEの主画面は `/home` のタイムラインを中心に再整理する。タイムラインの種類は従来の7タブではなく、以下の3種類に統一する。

- `following`: フォロー中
- `latest`: 最新
- `recommended`: おすすめ

従来の `foryou` は `recommended` に吸収する。URLは `/home?feed=latest&types=post,review,record` のように `feed` と `types` を持つ。`types` 未指定時は5機能すべてを表示する。

5機能は、短文投稿 `post`、長文記事 `article`、レビュー `review`、鑑賞記録 `record`、語り場 `thread` とする。ホームでは複数選択フィルタとして扱い、各機能ページでは同じ3種類のタイムラインをその機能に固定して表示する。内部の `quote` と `repost` は短文投稿系の活動として `post` フィルタに含める。

- `/posts`: 短文投稿の フォロー中 / 最新 / おすすめ
- `/articles`: 記事の フォロー中 / 最新 / おすすめ
- `/reviews`: レビューの フォロー中 / 最新 / おすすめ
- `/records`: 鑑賞記録の フォロー中 / 最新 / おすすめ
- `/threads`: 語り場の フォロー中 / 最新 / おすすめ

共通UIは `TimelineSurface` とし、画面から直接 Supabase を呼ばず `src/lib/data.ts` を経由する。供給構造は `feed_items` を維持し、公開タイムラインは `feed_items.visibility = public` の活動だけを表示する。

おすすめタイムラインはスコアで並べる。フォロー中ユーザー、フォロー中の作品・タグ、自分が記録した作品カテゴリ、トレンドタグ、いいね・コメント・ブックマーク・レス数などの反応量、鮮度を加点し、同点または材料不足なら最新順で補完する。

記録フォーム `/records/new` は2モードに分ける。

- ラフ記録: 作品、ステータス、日付、ひとことメモ、公開/非公開だけで保存できる。
- エキスパートモード: 鑑賞時間、ページ数、話数、曲数、場所、感情タグ、メモに加え、画像URL、長めのコメント、集中度、満足度、再訪したさ、カスタム数値を保存する。

記録詳細 `/records/[id]` は画像・コメント・数値チャートを表示する。統計 `/records/stats` はラフ記録も件数・カテゴリ統計に反映し、エキスパート数値がある場合は追加の推移グラフを表示する。星評価の真実は引き続き `records.rating` に置き、時間ログ/記録セッションは既定非公開を維持する。

年間総括 `/records/recap` は `lib/recap.ts` の年次集計を使い、月別推移、代表カテゴリ、完了作品、感情タグ、保存用カードを表示する。

語り場レスのいいねは `thread_reply_likes` で管理する。レス一覧では合計件数とログイン中ユーザーの押下状態を表示し、公開 select policy によって合計数を読めるようにする。

最終更新: 2026-06-15(v1.0: 2026-06-10)

この文書はZINE開発の「地図」です。実装中は常にこれを参照し、設計を変えたらこの文書も更新します。コードと設計書がズレることが、初心者プロジェクトが崩壊する最大の原因だからです。

**v1.1の主旨**: v1.0の技術的欠陥(RLSの穴・管理者ロールの不在・物理削除・星評価の二重管理)を修正し、サービス戦略(独りで完結する道具 → 社交は副産物)に基づいてフェーズを全面再編しました。差分は §0 にすべてまとめてあります。**このファイルを `docs/DESIGN.md` として v1.0 と差し替えてください。** CLAUDE.md への追記は §12 にあります。

## 目次

0. v1.0からの改訂差分(必読)
1. 全体設計とプロダクト原則
2. 技術スタック
3. デザインシステム(世界観の翻訳)
4. ディレクトリ構成
5. 画面構成
6. データベース設計
7. 実装フェーズ(v1.1再編版・全7フェーズ)
8. Phase 1 の詳細(最初に作る最小構成)
9. 初心者が迷いやすい点 トップ12
10. この設計が将来の拡張に耐える理由
11. 着手前の準備
12. CLAUDE.md へ反映する追記(コピペ用)

---

## 0. v1.0からの改訂差分(必読)

### 0-1. 設計判断の変更(改正)

| # | v1.0 | v1.1 | 理由 |
|---|---|---|---|
| 1 | works の書き込み権限=「ログインユーザー」 | INSERT は全ログインユーザー / UPDATE は登録者(created_by)と moderator 以上のみ | 誰でも他人の登録作品を改竄できる穴を塞ぐ |
| 2 | 管理者の概念がスキーマに無い | `profiles.role`('user' / 'moderator' / 'admin')を追加 | 通報処理・作品統合・語り場運営の主体を定義 |
| 3 | 削除は `on delete cascade` の物理削除のみ | posts / comments / threads / thread_replies は `deleted_at` による論理削除 | レス番号とアンカー(>>3)の保全、モデレーション、誤削除からの復旧 |
| 4 | 星評価が reviews.rating と work_records に二重に存在 | 評価は **work_records に一本化**。reviews.rating は削除 | 同期トリガー(初心者の地雷)を排除。真実は一箇所にだけ住まわせる |
| 5 | 通知は DB トリガーが生成 | 通知は **Server Action 側で生成**(カウンタの小トリガーは維持) | 見える・追える・直せる。トリガーは不可視の魔術になりやすい |
| 6 | 掲示板=独立した板階層(boards → threads) | **boards を廃止**。語り場は作品ページ内のタブとして作品に従属 | 過疎の分散と運営負荷を防ぐ。「作品が重力の中心」という判断3に忠実 |
| 7 | 匿名投稿を当初から提供 | **ハンドル(表示名)制で開始**。匿名表示は安全装置が揃った後の将来機能 | 匿名性は荒らしへの招待状。anon_id の生成式だけ先に固定(§6-6) |
| 8 | フォロー対象=ユーザーのみ | フォロー対象を **ユーザー / 作品 / タグ** の多態に | 文化の場では人より監督・作家・主題を追いたい欲求が強い |
| 9 | 作品DBはユーザー登録が主 | **APIによる事前シードが主**(TMDB・openBD)、手動登録は例外経路 | 「探したら、もうある」。レビューの前に登録という二重の手間は致命的 |
| 10 | ローンチ時から6カテゴリ全展開 | UI上は **映画+文学** から開始(スキーマは6カテゴリ保持) | 六正面作戦は過疎を六倍にするだけ。最初の百人が村の文化を決める |
| 11 | activity_logs(時間記録)は既定公開 | activity_logs は **既定非公開**(work_records=本棚は既定公開) | 日記性の保護。守られるべきものは守られ、批評は開かれる |

### 0-2. 追加されたもの

- **collections / collection_items**(作品リスト機能。「雨の日の映画十二選」)— Phase 5
- **オンボーディング** `/welcome`(初回に既知の10作品へ星付け → 本棚が初日から生きる)— Phase 3
- **月間/年間総括カード**(Wrapped型。共有可能な一枚絵)
- **「一冊に編む」機能**(自分の記事・レビューをデジタル冊子=zineに編纂。Web閲覧→PDF書き出し)— Phase 7。サービス名の回収であり、note にも Filmarks にも無い差別化
- **res番号の採番方式の明文化**(threads.reply_count をトランザクション内でインクリメント)
- **works.merged_into_id**(重複作品の統合)+ 登録フォームの「先に検索」UX
- **pg_trgm インデックスを最初から**(ILIKE加速)。本格化したら PGroonga(Supabase拡張)への道筋を明記
- **語り場の公開条件=安全三点セット**(Auth CAPTCHA / 連投制限 / NGワード)+ 通報
- **規約・プライバシーポリシー・通報窓口の簡易版**を友人公開(Phase 2完了)の条件に
- **バックアップ運用**(構造は migrations、データは節目ごとの pg_dump)
- **北極星指標と公開既定値**(§1-4 プロダクト原則)
- **Playwright スモークテスト**(各Phase完了時に1〜2本)
- **シードスクリプト**(scripts/ ディレクトリ。service_role キーの取扱規則つき)

### 0-3. 削除されたもの

- `boards` テーブルと `/boards` 系画面(判断6により作品従属へ)
- `reviews.rating` 列(判断4により work_records へ一本化)
- 完全匿名投稿の初期提供(判断7によりハンドル制から)

---

## 1. 全体設計とプロダクト原則

### 1-1. ZINEの構造を一枚で

```
                        ユーザー (profiles ※role付き)
                             │
   ┌─────────┬──────────┬───┴──────┬───────────┬──────────┐
   │         │          │          │           │          │
 短文      長文記事    レビュー    鑑賞記録    コレクション  語り場参加
   └─────────┴──────────┘          │           │          │
             ▼                     ▼           ▼          ▼
        posts テーブル        work_records  collections  threads /
      (type で種類を区別)    activity_logs              thread_replies
             │                     │           │          │
             └────── work_id ──────┴───────────┴──────────┘
                             ▼
                         works(作品)= 重力の中心
                             │
              フォロー対象は「人 / 作品 / タグ」の三態
```

### 1-2. 核心となる設計判断(v1.0の4つ+v1.1の3つ)

**判断1: 短文・記事・レビューは1つの `posts` テーブルに統一する**(v1.0から継続)

3つとも「タイムラインに流れる」「いいね・コメント・ブックマーク・タグが付く」という共通性質を持ちます。`type` カラム(`short` / `article` / `review`)で種類を区別し、レビュー固有の情報(対象作品・軸スコア・ネタバレ)だけを `reviews` テーブルに1対1でぶら下げます。

**判断2: 語り場は別系統だが、作品に従属する**(v1.1で改正)

スレッドのレスは「いいね無し」「レス番号で会話する」という別文化のため、`threads` / `thread_replies` として独立させる点は不変です。ただし独立した板階層(boards)は持たず、**すべてのスレッドは作品ページの「語り場」タブから生まれ、そこに帰属します**。ネタバレ可の区画として作品にぶら下がることで、過疎・荒れ・運営負荷の三重苦を避けます。

**判断3: 作品(works)がZINEの重力の中心**(v1.0から継続・強化)

レビュー・語り場・鑑賞記録・コレクションはすべて `work_id` で作品に紐づきます。作品ページを開けば「みんなのレビュー」「語り場」「自分の記録」「この作品を含むコレクション」が一望できます。

**判断4: 「本棚(work_records)」が評価の唯一の真実**(v1.1で強化)

「観た/積んでる」のステータス、**星評価**、鑑賞日を、ユーザー×作品につき1行の `work_records` で管理します。reviews テーブルは星を持ちません。レビュー表示時に work_records を JOIN して星を出します。

- レビューを書く → 星は本棚に付く(同期処理そのものが存在しない)
- 星だけ付ける → 本棚だけ更新される
- 作品の平均評価 = 本棚に付いた星の平均

**判断5: 独りで完結してから、社交を立ち上げる**(v1.1で新設)

SNSの墓場に眠るのは、機能が足りなかったサービスではなく、人が来なかったサービスです。五本柱のうちタイムライン・語り場・レビュー集計は他者がいなければ無価値ですが、**執筆と鑑賞記録は独りで成立します**。まず「自分の批評ノート兼鑑賞記録として最高」を達成し(Phase 2〜4)、社交はその上に立ち上げます(Phase 5〜)。道具で人を呼び、ネットワークで人を留める。

**判断6: 真実は一箇所にだけ住まわせる**(v1.1で新設)

評価は work_records、レス番号は threads.reply_count、通知の生成はServer Action。同じ事実を二箇所に書いて同期する設計は、初心者にとってデバッグ不能の迷宮になります。例外はカウンタ(like_count 等)の小トリガーのみ(標準的かつ局所的なため)。

**判断7: 削除は消さずに隠す**(v1.1で新設)

posts / comments / threads / thread_replies のユーザー操作による削除は `deleted_at` を立てる論理削除とし、画面には「削除済み」のプレースホルダ(いわゆる「あぼーん」)を出します。レス番号とアンカーの不変性は掲示板文化の前提であり、モデレーションと誤削除復旧の土台にもなります。アカウント削除時の cascade(法的・プライバシー要請)は従来どおり物理削除です。

### 1-3. v1.0からの変更一覧

§0 を参照。実装中に迷ったら、必ず §0 の表に立ち返ってください。

### 1-4. プロダクト原則(サービス面)

**北極星指標: 「月間に書かれたレビューの数(と総語数)」**。DAUを追えば刺激の競争に堕ち、書かれた言葉を追えば批評の場に育ちます。何を測るかが、そのサービスが何になるかを決めます。

**公開の既定値**: 時間ログ(activity_logs)=非公開、本棚(work_records)=公開、レビュー・記事=公開。日記は守られ、批評は開かれる。この初期設定が文芸的な利用者層の信頼を左右します。

**記録の報酬は「量」ではなく「自画像」**: 鑑賞時間の合計は誇りになりません。ジャンル分布・年代分布・嗜好の五角形——「あなたの審美眼の星図」を返すこと。人は数字ではなく、自分の輪郭が見たいのです。

**立ち上げ戦術**:
1. 最初の住人はあなた自身。一般公開までに自分の手本レビューを50本置く(村の文化はそれで決まる)
2. UI上のカテゴリは映画+文学から。音楽は第二波、ファッション・展示(API皆無)は当面非表示
3. 作品DBはシード済みで公開。「検索→見つかる→書く」が標準経路、手動登録は例外経路
4. 公開順序: 独り運用(P2〜4)→ 友人招待(P5)→ 一般公開(P6以降)

---

## 2. 技術スタック

| 技術 | 役割 |
|---|---|
| Next.js(App Router・最新安定版) | 画面とサーバー処理の土台 |
| TypeScript | 型でミスをコンパイル時に発見する |
| Tailwind CSS v4 | スタイリング(設定は globals.css の @theme。tailwind.config.js は作らない) |
| shadcn/ui | UI部品の雛形。コードが components/ui にコピーされる方式で、ZINEの世界観に合わせて編集する |
| Supabase | 認証(Auth)・データベース(Postgres)・画像置き場(Storage) |
| @supabase/supabase-js + @supabase/ssr | Next.jsからSupabaseに安全に接続する公式ライブラリ |
| **pg_trgm**(Postgres拡張) | 日本語部分一致検索(ILIKE)の高速化。Phase 2から有効化 |
| Zod | フォーム入力の検証(クライアント/サーバーで共有) |
| Tiptap | 長文記事のリッチテキストエディタ(Phase 2で導入) |
| Recharts | 五角形(レーダー)チャート・統計グラフ(Phase 3で導入) |
| next/font | フォントの最適化読み込み |
| next-themes | ダークモード切替 |
| **Playwright** | 各Phase完了時のスモークテスト(Phase 2完了時に導入) |
| **tsx(Nodeスクリプト実行)** | scripts/ のシードスクリプト用 |
| Vercel | デプロイ(公開) |

**将来の選択肢として明記しておくもの**: 本文の本格的な日本語全文検索が必要になったら **PGroonga**(Supabaseで拡張として利用可)。スキーマ変更なしで移行できます。

### Prismaを使わない理由(v1.0から不変)

Supabaseの安全装置である RLS(§6-2)は「Supabaseクライアント経由のアクセス」に対して効きます。PrismaはDB管理者として直接接続するためRLSを素通りし、セキュリティチェックを全部アプリ側に書き直す必要が生じます。型安全は `supabase gen types` によるTypeScript型の自動生成で確保します。

---

## 3. デザインシステム(世界観の翻訳)

### 3-1. 原則

ZINEの世界観は「**深夜の活版印刷所の静けさ**」。SNSの喧噪ではなく、紙とインクの落ち着きを画面に翻訳します。

- ダークモードが主役(デフォルト)。ライトは「紙」のテーマ
- 影は使わない。区切りはすべて1pxの薄い罫線(hairline)
- 角丸は2〜4px。カードを浮かせず、紙面に「組む」
- 装飾より余白。余白の基準は8pxの倍数
- 見出しは明朝で「印刷物の声」を、UI本文はゴシックで可読性を、数値・日時は等幅で「組版の規律」を

### 3-2. デザイントークン(globals.css の @theme に定義)

> **注**: 既に Phase 1 を v1.0 のトークン値で実装済みの場合は、実装側を正として本表の値を上書き更新してください(原則と禁止事項は不変)。未着手なら本表が正です。

| トークン | ダーク(既定) | ライト(紙) | 用途 |
|---|---|---|---|
| --color-bg | #100F0D | #F5F2EA | 背景(墨 / 生成りの紙) |
| --color-bg-raised | #171511 | #FBF9F3 | カード・入力欄 |
| --color-fg | #E8E4DA | #1C1B18 | 本文 |
| --color-fg-muted | #9A958A | #6B675E | 補助テキスト・日時 |
| --color-hairline | rgba(232,228,218,.13) | rgba(28,27,24,.14) | 罫線 |
| --color-accent | #C4493C | #B23E32 | 朱。リンク・主ボタン・選択状態 |
| --color-accent-subtle | rgba(196,73,60,.12) | rgba(178,62,50,.10) | 朱の淡い面 |
| --color-star | #C9A227 | #A8861E | 星評価(マットな金) |
| --color-danger | #B3433E | #A03A35 | 破壊的操作 |

| フォント | 指定 | 用途 |
|---|---|---|
| --font-display | Zen Old Mincho | 見出し・作品名・ロゴ |
| --font-serif | Noto Serif JP | 長文記事の本文(読む時間のための書体) |
| --font-sans | Noto Sans JP | UI・短文・フォーム |
| --font-mono | IBM Plex Mono | 日時・数値・レス番号・統計 |

### 3-3. 禁止事項(量産型UIの回避)

- 紫青グラデーション、原色バッジ、見出しの絵文字
- 角丸16px超のカード、ドロップシャドウの多用
- デザイントークン外の色のhex直書き
- 過剰なアニメーション(許すのは opacity と小さな translate のみ)

---

## 4. ディレクトリ構成

```
zine/
├── app/                       # 画面。フォルダ構造がURLと1対1対応
│   ├── (marketing)/
│   │   └── page.tsx           # / ランディング
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                 # ログイン後の世界(共通レイアウト)
│   │   ├── layout.tsx         # Sidebar + Header + MobileNav
│   │   ├── home/page.tsx      # タイムライン
│   │   ├── welcome/page.tsx   # ★新 オンボーディング(10作品に星)
│   │   ├── post/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── article/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── works/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx   # 手動登録(例外経路。先に検索を強制)
│   │   │   └── [id]/page.tsx  # 概要/レビュー/語り場/コレクションのタブ
│   │   ├── reviews/new/page.tsx
│   │   ├── threads/[id]/page.tsx      # スレ詳細(入口は作品ページのタブ)
│   │   ├── collections/               # ★新
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── records/page.tsx           # 記録ダッシュボード+月間総括
│   │   ├── profile/[username]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx             # 全体共通(フォント・テーマ)
│   └── globals.css            # デザイントークン(§3)
├── components/
│   ├── ui/                    # shadcn/ui(ZINEの世界観へ改造する)
│   ├── layout/                # Sidebar, Header, MobileNav
│   ├── post/                  # PostCard, ArticleCard, Composer など
│   ├── work/                  # WorkCard, RatingStars, RadarChart, StatusButtons
│   ├── discussion/            # ThreadCard, ResItem(旧 board/)
│   ├── collection/            # ★新 CollectionCard, CollectionItemRow
│   ├── record/                # ★新 StatsChart, RecapCard(総括カード)
│   ├── user/                  # UserAvatar, FollowButton(人/作品/タグ対応)
│   └── common/                # EmptyState, LoadingState, ErrorState, TagBadge,
│                              #   DeletedPlaceholder(論理削除の表示)
├── lib/
│   ├── supabase/              # client.ts / server.ts
│   ├── constants/             # カテゴリ定義・レビュー軸定義・ステータス表示名
│   ├── validations/           # Zodスキーマ
│   └── utils.ts
├── hooks/
├── types/
│   └── database.ts            # supabase gen types で自動生成
├── scripts/                   # ★新 シードスクリプト(アプリとは別世界)
│   ├── seed-tmdb.ts           # 映画(TMDB API)
│   ├── seed-openbd.ts         # 書籍(openBD API)
│   └── .env.example           # service_role キーはここ専用(§6-5)
├── supabase/
│   └── migrations/            # テーブル定義SQL(データベースの履歴書)
└── middleware.ts              # 認証セッションの維持
```

---

## 5. 画面構成

「★新」はv1.1での追加。boards系画面はv1.1で廃止されました。

| パス | 画面 | Phase |
|---|---|---|
| `/` | ランディング(世界観の提示) | 1 |
| `/home` | タイムライン(最新。フォロー中/人気の切替はPhase 5) | 1(ダミー)→2 |
| `/login` `/signup` | 認証 | 2 |
| `/post/new` | 短文投稿 | 2 |
| `/post/[id]` | 投稿詳細(コメント欄はPhase 5で活性化) | 1(ダミー)→2 |
| `/article/new` | 長文エディタ(静かな執筆画面) | 2 |
| `/article/[id]` | 記事の閲覧ページ | 2 |
| `/search` | 検索(投稿→Phase 2 / 作品→Phase 3 / ユーザー→Phase 5) | 2(簡易)→ |
| `/settings` | 設定(プロフィール編集・テーマ・公開既定値) | 2 |
| `/profile/[username]` | プロフィール(投稿/記事/レビュー/本棚/コレクションのタブ) | 2→順次拡張 |
| `/welcome` | ★新 オンボーディング(観た作品10件に星) | 3 |
| `/works` | 作品一覧(カテゴリ絞り込み。UI上は映画+文学から) | 3 |
| `/works/new` | 作品の手動登録(「先に検索」を強制する導線) | 3 |
| `/works/[id]` | 作品詳細(平均評価・五角形・レビュー一覧/語り場タブはPhase 6) | 3 |
| `/reviews/new` | レビュー投稿(`?work=id` で作品を指定して開く) | 3 |
| `/records` | ★新 記録ダッシュボード(統計・嗜好の星図・月間総括) | 4 |
| `/collections` `/collections/new` `/collections/[id]` | ★新 コレクション | 5 |
| `/notifications` | 通知 | 5 |
| `/bookmarks` | ブックマーク | 5 |
| `/threads/[id]` | スレッド詳細(レス・アンカー) | 6 |
| `/zines/[id]` | ★将来 編まれた冊子の閲覧(Phase 7で画面設計) | 7 |

---

## 6. データベース設計

### 6-0. 共通ルール

- 主キーは `id uuid default gen_random_uuid()`(複合キーの表を除く)
- 全テーブルに `created_at timestamptz default now()`(以下の表では省略)
- ユーザー本体は `auth.users` を使い、自前の users テーブルは作らない。公開情報は `profiles`
- 外部キーは `on delete cascade` を基本(アカウント削除=本人データの物理消去)
- **論理削除ルール(v1.1)**: posts / comments / threads / thread_replies に `deleted_at timestamptz null` を持たせる。ユーザー操作の「削除」は `deleted_at` を立てる UPDATE であり、物理 DELETE をアプリから発行しない。読み取りクエリは原則 `where deleted_at is null`(語り場のレスだけは行を返し、画面側で「削除済み」プレースホルダ表示——レス番保全のため)
- `profiles.role` の変更は当面 Supabase ダッシュボード(SQLエディタ)からのみ行う。アプリにUIを作らない。運営はまずあなた一人です

### 6-1. テーブル定義(18テーブル)

**profiles** — ユーザーの公開情報

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | auth.users.id と同じ値。サインアップ時にトリガーで自動作成 |
| username | text UNIQUE | URL用(英数字) |
| display_name | text | 表示名 |
| bio / website | text | 自己紹介・外部リンク |
| avatar_url / header_url | text | アイコン・ヘッダー画像 |
| **role** | text default 'user' | 'user' / 'moderator' / 'admin'(check制約) |

**posts** — 短文・記事・レビューの本体

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| author_id | uuid FK→profiles | |
| type | text | `short` / `article` / `review` |
| body | text | 短文の本文 / 記事のMarkdown / レビューの感想文 |
| title | text NULL | 記事タイトル(レビューでも任意) |
| cover_image_url | text NULL | 記事のカバー画像 |
| status | text | `published` / `draft` |
| published_at | timestamptz NULL | |
| repost_of_post_id | uuid NULL FK→posts | リポスト/引用元(Phase 7) |
| like_count / comment_count | int default 0 | カウンタ。小トリガーで自動更新(例外として許可) |
| **deleted_at** | timestamptz NULL | 論理削除 |

**reviews** — postsのレビュー拡張(1対1)。**rating列は持たない(判断4)**

| カラム | 型 | 説明 |
|---|---|---|
| post_id | uuid PK FK→posts | レビュー投稿のid |
| work_id | uuid FK→works | 対象作品 |
| axes | jsonb NULL | 五角形の軸別スコア。例 `{"story":4,"visual":5}`。軸定義はカテゴリ別に lib/constants で固定 |
| has_spoiler | boolean default false | ネタバレフラグ(本文を畳んで表示) |

**works** — 作品

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| category | text | `film` / `music` / `literature` / `art` / `fashion` / `exhibition` / `other`(スキーマは全保持、UI表示はPhaseで制御) |
| title / title_kana | text | 作品名・検索用よみがな |
| creator | text | 監督・著者・アーティスト |
| release_year | int NULL | |
| cover_url | text NULL | API由来はURL直参照(§6-3) |
| description | text NULL | |
| external_ids | jsonb NULL | 例 `{"tmdb":603,"isbn":"978..."}`。API連携の後付けを可能にする |
| **created_by** | uuid NULL FK→profiles | 手動登録者(シード由来はNULL) |
| **merged_into_id** | uuid NULL FK→works | 重複統合。非NULLなら統合先へリダイレクト |

**work_records** — 本棚。評価の唯一の真実(ユーザー×作品で1行)

| カラム | 型 | 説明 |
|---|---|---|
| user_id + work_id | 複合PK(両FK) | |
| status | text | `watched` / `listening` / `read` / `visited` / `want` / `stacked` 等(カテゴリ別表示名は constants) |
| **rating** | numeric(2,1) NULL | 0.5〜5.0。作品の平均評価はこの列の平均 |
| started_on / finished_on | date NULL | |
| memo | text NULL | 短い私的メモ |
| is_private | boolean default **false** | 本棚は既定公開 |

**activity_logs** — 鑑賞・読書の時間/量の記録(StudyPlus的日記)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| work_id | uuid NULL FK | 作品に紐づかない記録(「読書90分」)も許す |
| category | text | 集計用 |
| minutes / pages | int NULL | どちらか以上 |
| logged_on | date | |
| is_private | boolean default **true** | 日記は既定非公開(判断11) |

**comments** — postsへのコメント(+ deleted_at)
**likes / bookmarks** — user_id + post_id の複合PK

**follows** — 多態フォロー(判断8)

| カラム | 型 | 説明 |
|---|---|---|
| follower_id | uuid FK→profiles | |
| followee_user_id | uuid NULL FK→profiles | 人を追う |
| work_id | uuid NULL FK→works | 作品を追う(新レビュー・新スレ通知) |
| tag_id | uuid NULL FK→tags | 主題を追う |
| — | CHECK制約 | `num_nonnulls(followee_user_id, work_id, tag_id) = 1`(三択のうち必ず一つだけ) |

**tags / post_tags** — タグとその中間テーブル

**threads** — 語り場のスレッド(boardsは廃止。必ず作品に従属)

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| work_id | uuid FK→works **NOT NULL** | 帰属する作品 |
| author_id | uuid FK→profiles | |
| title | text | |
| **reply_count** | int default 0 | レス番号の採番台帳(§6-6) |
| deleted_at | timestamptz NULL | |

**thread_replies** — レス

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| thread_id | uuid FK→threads | |
| **res_number** | int | UNIQUE(thread_id, res_number)。採番は§6-6 |
| author_id | uuid FK→profiles | 内部的には常に記録(ハンドル制) |
| body | text | アンカー(>>3)はクライアント側で解釈 |
| deleted_at | timestamptz NULL | 削除時も行とres_numberは残り「削除済み」表示 |

**notifications** — Server Actionが作成(トリガー禁止)

| カラム | 型 | 説明 |
|---|---|---|
| id / user_id(受け手) / actor_id | uuid | |
| type | text | like / comment / follow / new_review_on_followed_work 等 |
| post_id / work_id / thread_id | uuid NULL | 文脈リンク |
| read_at | timestamptz NULL | |

**reports** — 通報

| カラム | 型 | 説明 |
|---|---|---|
| id / reporter_id | uuid | |
| target_type / target_id | text / uuid | post / comment / thread_reply / work / user |
| reason | text | |
| status | text default 'open' | open / resolved / dismissed |
| handled_by | uuid NULL FK→profiles | moderator以上 |

**collections** — 作品リスト(★新)

| カラム | 型 | 説明 |
|---|---|---|
| id / owner_id | uuid | |
| title / description | text | 「雨の日の映画十二選」 |
| cover_image_url | text NULL | |
| is_private | boolean default false | |

**collection_items**

| カラム | 型 | 説明 |
|---|---|---|
| collection_id + work_id | 複合PK | |
| position | int | 並び順 |
| note | text NULL | 一言キュレーション |

**zines(一冊に編む。Phase 7で確定)**

| カラム | 型 | 説明 |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK→profiles | |
| title | text | 冊子の題 |
| description | text | まえがき(任意) |
| is_private | boolean default false | |
| created_at | timestamptz | |

**zine_items**

| カラム | 型 | 説明 |
|---|---|---|
| zine_id + item_type + source_id | 複合PK | |
| item_type | text | `article` / `review`(ポリモーフィック。草案の post_id 束ねから変更: 編むのは長文) |
| source_id | uuid | articles.id / reviews.id |
| position | int | 並び順(所有者しか書かないため件数採番) |

RLSは collections と同型(is_private = false or 本人。zine_items は親の可視性に従う)。
削除は物理削除でよい(冊子は索引であり、本体の記事・レビューは残る)。

### 6-2. RLS(Row Level Security)の方針

全テーブルでRLSを有効化。moderator判定には `security definer` のヘルパー関数 `is_moderator()`(profiles.roleが moderator/admin か)を1つ用意し、各ポリシーから呼びます。

| テーブル | 読み | 書き |
|---|---|---|
| profiles | 全員 | 本人のみ更新(role列の変更はダッシュボードからのみ。§6-0) |
| posts | published は全員 / draft は本人 | INSERT・UPDATE(論理削除含む)は本人。moderatorは deleted_at のみ更新可 |
| reviews / comments / likes / bookmarks / follows / tags / post_tags | 全員 | 本人のみ |
| works | 全員(merged_into_id 非NULLは統合先へ誘導) | **INSERT: ログインユーザー / UPDATE: created_by本人 または is_moderator()**。merged_into_id の設定は moderator のみ |
| work_records / activity_logs | is_private=false は全員 / true は本人 | 本人のみ |
| collections / collection_items | is_private=false は全員 / true は本人 | 本人のみ |
| threads / thread_replies | 全員(deleted_atの行も返し、表示側で処理) | INSERT: ログインユーザー / 論理削除は本人 or is_moderator() |
| notifications | 受け手本人のみ | INSERT は `actor_id = auth.uid()` のログインユーザー(Server Action経由) |
| reports | 自分が出した通報 + is_moderator() は全件 | INSERT: ログインユーザー / status更新: is_moderator() |

### 6-3. Storage(画像)

| バケット | 用途 | ルール |
|---|---|---|
| avatars | アイコン・ヘッダー | 公開読み取り。`{userId}/...` に本人のみアップロード可 |
| post-images | 投稿・記事内画像、カバー | 同上 |
| work-covers | 手動登録作品のカバー | 公開読み取り。ログインユーザーがアップロード可 |

- アップロード時は**クライアント側リサイズを必須**にし(上限例: 5MB→長辺2000px)、canvasでの再エンコードによりEXIF(撮影位置情報)が実質的に除去される——容量対策とプライバシー対策の一石二鳥
- API由来の作品カバーはStorageに複製せず、提供元のURLを直参照する(TMDBは規約に従い帰属表示を、openBDは書影利用条件を確認のうえ)

### 6-4. 検索

- Phase 2: `create extension pg_trgm;` を最初のmigrationsで実行し、posts.title、works.title / title_kana / creator に GIN(trgm)インデックス。検索は ILIKE 部分一致のままで速くなる
- 本文(posts.body)の本格的な日本語全文検索が必要になったら PGroonga へ。スキーマ変更は不要

### 6-5. シードスクリプト(scripts/)の規律

- 映画: TMDB API(無料・要APIキー・**帰属表示が義務**。「This product uses the TMDB API but is not endorsed or certified by TMDB.」をフッターまたはaboutに掲示)
- 書籍: openBD API(無料・キー不要)
- 規模の目安: 映画1,000件+文学(文庫の定番中心)1,000件をPhase 3で投入
- **service_role キーは scripts/.env にのみ置く**。アプリ(app/ 以下)のコードと .env.local には絶対に書かない。シードはローカルから手動実行する儀式であり、アプリの一部ではない

### 6-6. 採番と匿名IDの定義(将来分も先に固定)

- **レス番号**: レス投稿のServer Actionで、`update threads set reply_count = reply_count + 1 ... returning reply_count` をトランザクション内で実行し、返り値を res_number として insert。count+1 方式は同時書き込みで衝突するため禁止
- **anon_id(将来の匿名表示用・いまは実装しない)**: `hash(user_id, thread_id, サーバー秘密鍵)` の先頭8文字。スレ内では一貫、スレ間では別人、外部からは逆算不能。秘密鍵が漏れた瞬間に匿名性は終わる——保管はサーバー環境変数のみ

### 6-7. バックアップ

- 構造は supabase/migrations/ がすべて(Gitに残る)
- データは各Phase完了時に `pg_dump` をローカル保存(無料枠の自動バックアップに頼らない)。星は流れても、銀河の記録は手元に残す

---

## 7. 実装フェーズ(v1.1再編版・全7フェーズ)

再編の原理は判断5(独りで完結 → 社交は副産物)です。**v1.0との最大の違い: いいね・コメントはPhase 2から外れPhase 5へ、作品・記録が前倒し、語り場は最後尾へ。**

各Phase共通の「終わりの儀式」: ①Vercelへデプロイし公開URLで確認 ②Playwrightスモークテスト1〜2本が通る(Phase 2から) ③pg_dumpをローカル保存 ④コミット。

**Phase 1: 基盤とデザインシステム(DBなし)** — v1.0から変更なし
- プロジェクト作成、Tailwind / shadcn/ui 導入、§3トークンとフォント4種の定義、/styleguide
- AppLayout(Sidebar / Header / MobileNav)、ダークモード(既定はダーク)
- `/` ランディング、`/home`(ダミーデータのタイムライン)、`/post/[id]`(ダミー詳細)
- 完了の定義: スマホとPCで美しく表示され、Vercelの公開URLで見られる

**Phase 2: 認証と執筆(独りで「書ける」)**
- 2a. Supabase接続、サインアップ/ログイン、profiles自動作成トリガー、/settings
- 2b. 短文投稿(Composer)→ 一覧 → 詳細(コメント欄はまだ非活性)
- 2c. 長文記事(Tiptap・下書き・カバー画像アップロード)
- 2d. タグ、pg_trgm有効化、簡易検索(自分の文章を主題で引ける)
- 公開条件: 利用規約・プライバシーポリシー・連絡先(通報窓口)の簡易版を/aboutに掲示
- 完了の定義: あなたが独りで短文と記事を書き溜め、下書きを保存し、タグで自分の言葉を再訪できる。URLを渡せば友人も読める

**Phase 3: 作品と本棚(独りで「記録できる」)**
- シードスクリプト実行(映画TMDB+文学openBD。§6-5)
- 作品検索・一覧・詳細(UI上のカテゴリは映画+文学のみ表示)
- work_records(ステータス・星・公開設定)。手動登録 /works/new は「先に検索」を強制
- レビュー投稿(感想+軸スコア+ネタバレフラグ。星は本棚に付く)
- 作品ページ: 平均評価(work_records星の平均)・五角形・レビュー一覧
- /welcome オンボーディング(観たことのある10作品に星 → 本棚が初日から生きる)
- 完了の定義: 「検索→見つかる→星→レビュー」が3分で完結する。空の聖堂ではなく、灯のともった書斎になっている

**Phase 4: 記録と自画像(独り完結の完成)**
- activity_logs(時間・頁数。既定非公開)
- /records: 月間鑑賞時間グラフ、カテゴリ内訳、年代分布、嗜好の五角形——「審美眼の星図」
- 月間総括カード(画像として保存・共有できる一枚絵)
- 完了の定義: 「今月は映画12本・活字600頁」と自分の嗜好の輪郭が一望でき、思わず人に見せたくなる

**Phase 5: 社交(友人招待)**
- フォロー(人/作品/タグの多態)、いいね、コメント、ブックマーク
- 通知(Server Actionで生成)、タイムライン切替(最新/フォロー中/人気の簡易版)
- コレクション(作品リスト)作成・公開
- プロフィールのタブ拡張(レビュー/本棚/コレクション)
- 完了の定義: 友人数名と相互にフォローし、レビューに灯(いいね)が付き、通知が届く

**Phase 6: 語り場(一般公開の前提)**
- 作品ページ「語り場」タブ、スレ作成、レス(res_number・アンカー)、ハンドル表示
- 論理削除の「削除済み」表示、通報フロー(moderator処理画面の最小版)
- **公開条件(安全三点セット)**: Supabase AuthのCAPTCHA(Turnstile)有効化 / 連投の時間制限 / NGワードフィルタ。三点が揃うまで語り場は世に出さない
- 完了の定義: 作品ページから議論へ潜り、荒らしへの最低限の盾を持った状態で語り合える

**Phase 7: 編纂と祝祭**
- 「一冊に編む」: 自分の記事・レビューを選んでデジタル冊子に編纂(Web閲覧 → PDF書き出し)。zines / zine_items のスキーマ確定
- リポスト/引用のフィード表示、トレンドタグ集計、おすすめ強化を整備
- 完了の定義: 一年の言葉が一冊に編まれ、`/zines/[id]` のURLで人に手渡せる

---

## 8. Phase 1 の詳細(最初に作る最小構成)

DBより先にUIから作る理由は2つ。①初心者は「見えるもの」から作ると挫折しにくい。②ZINEは世界観が命なので、デザイントークンを最初に固定し、以後の全機能がその上に乗るようにするため。

成果物チェックリスト:

- [ ] create-next-app(TypeScript / Tailwind / App Router)
- [ ] globals.css に §3 のトークン(ダーク/ライト)を定義、next/font でフォント4種
- [ ] /styleguide(色・フォント・ボタンの一覧確認ページ)
- [ ] shadcn/ui を初期化し、Button等の見た目をZINE仕様に上書き
- [ ] AppLayout: PCは左Sidebar+中央フィード+余白、モバイルは下部MobileNav
- [ ] ダークモード(next-themes。既定はダーク)
- [ ] ダミーデータ(lib/dummy-data.ts)で PostCard / ArticleCard / ReviewCard が並ぶ /home(ReviewCardの星は「本棚の星」を表示する想定でデータ形状を作る)
- [ ] /post/[id] のダミー詳細+コメントUI(見た目のみ)
- [ ] / ランディング(ロゴ・コピー・世界観)
- [ ] Vercelデプロイ

---

## 9. 初心者が迷いやすい点 トップ12

1. **Server / Client Component の区別**: 基本はサーバー描画。useState や onClick を使うファイルだけ先頭に `'use client'`。「useState only works in a Client Component」が出たらこれ
2. **RLSの書き忘れ**: テーブルを作ったのにデータが取れない場合、9割はポリシー未設定。「テーブル作成とRLSはセット」
3. **環境変数**: 接続情報は .env.local。`NEXT_PUBLIC_` 付きだけがブラウザに公開される。service_role キーはアプリ側に書かない(scripts/.env のみ。§6-5)
4. **profilesが作られない問題**: サインアップは auth.users に行が増えるだけ。profiles はトリガーで自動作成(Phase 2a)
5. **古いチュートリアルとの混線**: Pages Router や Tailwind v3(tailwind.config.js)の記事が大量にある。本プロジェクトは App Router + Tailwind v4(@theme)
6. **型生成のし忘れ**: DBを変更したら `supabase gen types` を再実行。型エラーは「DBとコードのズレ」のサイン
7. **next/image で画像が出ない**: Supabase StorageとTMDB画像のドメインを next.config の images に許可する
8. **エラーとの付き合い方**: Consoleとターミナルの赤字を読み、エラー文をそのまま検索するかAIに貼る。「なんか動かない」で止まらない
9. **Gitの習慣**: 1機能できたらコミット。壊れても巻き戻せる安心感が学習速度を上げる
10. **shadcn/ui は編集してよい**: components/ui にコピーされる方式。ZINEの世界観に合わせて書き換えるのが正しい使い方
11. **論理削除の WHERE 忘れ(v1.1)**: posts等の取得で `deleted_at is null` を忘れると亡霊が画面に出る。共通のクエリ関数(例: lib/queries/posts.ts)に集約し、各画面で生クエリを書かない
12. **シードと本番の境界(v1.1)**: scripts/ は「ローカルから手動で回す儀式」。アプリのデプロイに含めない。service_role キーがVercelの環境変数に入っていたら設計違反と思え

---

## 10. この設計が将来の拡張に耐える理由

- **投稿の統一モデル**: 新しい投稿タイプは type の追加で済み、いいね・コメント・タグ・タイムラインが自動対応
- **work_records ハブ**: 平均評価・本棚・統計・月間/年間総括・嗜好の星図——すべてこの1テーブルから派生する
- **多態フォロー**: 「人/作品/タグ」のCHECK制約1行で、通知とフィードの拡張(作品の新レビュー通知など)が同じ配管に乗る
- **論理削除**: モデレーション・復旧・「削除済み」表示の土台。語り場文化(レス番不変)とも整合
- **collections → zines への導線**: 並べる(コレクション)から編む(冊子)へ、同じ「キュレーション」軸上で機能が育つ
- **external_ids (jsonb)**: TMDB・openBD・MusicBrainz等の連携をスキーマ変更なしで後付け
- **RLSによるDB層のセキュリティ**: 将来PWAやネイティブアプリを足しても、守りはDB側にある
- **SupabaseはただのPostgres**: 要件が育てばセルフホストや別基盤への移行も現実的
- **型の自動生成**: スキーマ変更の影響範囲をコンパイラが教えてくれる

---

## 11. 着手前の準備

1. Node.js LTS(nodejs.org)
2. VS Code と拡張機能(ESLint / Prettier / Tailwind CSS IntelliSense)
3. Git と GitHub アカウント
4. Vercel アカウント(GitHub連携)
5. Supabase アカウント(Phase 2から使用)
6. **TMDB アカウントとAPIキー**(無料。Phase 3のシードで使用。帰属表示義務に注意)
7. Playwright は Phase 2 完了時に導入すれば十分

---

## 12. CLAUDE.md へ反映する追記(コピペ用)

CLAUDE.md の「データベース規約」「作業の進め方」の下に、以下をそのまま追記してください。設計書と憲法がズレたまま着工するのが一番の悲劇です。

```markdown
## v1.1 追加規約
- 星評価は work_records が唯一の真実。reviews テーブルに rating を持たせない
- 通知は Server Action で作成する。DBトリガーで通知を作らない
  (like_count 等のカウンタの小トリガーのみ例外として可)
- posts / comments / threads / thread_replies の削除は deleted_at による論理削除。
  アプリから物理 DELETE を発行しない。読み取りは共通クエリ関数経由で
  deleted_at is null を徹底する(語り場のレスは行を返し「削除済み」表示)
- works の UPDATE は created_by 本人か moderator のみ(RLSで強制)
- service_role キーは scripts/.env 専用。app/ 以下と .env.local に書いたら設計違反
- フェーズは DESIGN.md v1.1 §7(全7フェーズ)に従う。v1.0の6フェーズ構成は破棄
```

---

準備ができたら、v1.0と同じく「実装してください」の一言で Phase 1 を開始できます。まず独りの記録者にとって完璧な道具を磨くこと——星々もはじめは塵の集積です。
