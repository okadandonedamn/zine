/**
 * ZINE ドメイン型定義
 * supabase/schema.sql のテーブル構造と1:1で対応させている。
 * Phase 7 でSupabaseに接続するとき、この型をそのまま使い回せる。
 */

export type WorkCategory =
  | "film"
  | "music"
  | "literature"
  | "art"
  | "fashion"
  | "exhibition"
  | "stage"
  | "game"
  | "other";

export const CATEGORY_LABELS: Record<WorkCategory, string> = {
  film: "映画",
  music: "音楽",
  literature: "文学",
  art: "美術",
  fashion: "ファッション",
  exhibition: "展示",
  stage: "舞台",
  game: "ゲーム",
  other: "その他",
};

/** カレンダーのドットや統計グラフで使うカテゴリ色 */
export const CATEGORY_COLORS: Record<WorkCategory, string> = {
  film: "#c2563a",
  music: "#3d7a6e",
  literature: "#8a6d3b",
  art: "#5b5e8d",
  fashion: "#a04a6e",
  exhibition: "#4a7a9c",
  stage: "#7d5ba6",
  game: "#5e8a4a",
  other: "#7a7468",
};

export type Visibility = "public" | "private";

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  /** アバターの色相(0-360)。画像がないときは色で個性を出す */
  avatarHue: number;
  /** Supabase Storage にアップロードされたアバター画像 */
  avatarUrl?: string;
  followers: number;
  following: number;
}

export interface Work {
  id: string;
  title: string;
  category: WorkCategory;
  creator: string;
  year: number;
  description: string;
  tags: string[];
  avgRating: number;
  reviewCount: number;
  recordCount: number;
  /** カバー画像の代わりのグラデーション(将来Storageの画像URLに置換) */
  coverFrom: string;
  coverTo: string;
}

/** 自由評価軸の1軸ぶん(review_scores テーブルの1行に対応) */
export interface AxisScore {
  axis: string;
  score: number; // 1-10
}

export interface Post {
  id: string;
  body: string;
  tags: string[];
  likes: number;
  reposts: number;
  comments: number;
  bookmarks: number;
}

export interface Review {
  id: string;
  workId: string;
  rating: number; // 0.5刻み、最大5
  body: string;
  spoiler: boolean;
  axes: AxisScore[];
  tags: string[];
  likes: number;
  comments: number;
  visibility: Visibility;
  author?: User;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  readMinutes: number;
  likes: number;
  comments: number;
  coverFrom: string;
  coverTo: string;
  relatedWorkIds: string[];
  author?: User;
}

export type RecordStatus =
  | "want" // 観たい/聴きたい/読みたい/行きたい
  | "doing" // 観ている/聴いている/読んでいる
  | "done" // 観た/聴いた/読んだ/行った
  | "stacked" // 積んでいる
  | "paused" // 中断した
  | "rewatch"; // 再鑑賞したい

/** 1回の鑑賞ログ(record_sessions テーブルに対応) */
export interface RecordEntry {
  id: string;
  workId: string;
  status: RecordStatus;
  date: string; // ISO
  durationMinutes?: number;
  pages?: number;
  episodes?: number;
  tracks?: number;
  memo?: string;
  emotionTags: string[];
  place?: string;
  visibility: Visibility;
}

export interface Goal {
  id: string;
  title: string;
  category: WorkCategory | "all";
  period: "weekly" | "monthly" | "yearly";
  target: number;
  current: number;
  unit: string; // 本・冊・枚・回 など
}

export interface Board {
  id: string;
  name: string;
  description: string;
  category: WorkCategory | "general";
  threadCount: number;
}

export interface Thread {
  id: string;
  boardId: string;
  title: string;
  body: string;
  replyCount: number;
  anonymous: boolean;
  workId?: string;
  createdAt: string;
  lastReplyAt: string;
}

export interface ThreadReply {
  id: string;
  threadId: string;
  number: number;
  name: string; // 匿名なら「名無しの批評家」など
  body: string;
  quoteNumber?: number;
  likes: number;
  createdAt: string;
}

/** カテゴリ別の評価軸テンプレート */
export interface AxisTemplate {
  id: string;
  name: string;
  category: WorkCategory | "custom";
  axes: [string, string, string, string, string];
}

/** ログイン中ユーザーがこのフィード項目に対して行ったリアクション */
export interface ViewerState {
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
}

/** フィード項目へのコメント(comments テーブルに対応) */
export interface Comment {
  id: string;
  body: string;
  user: User;
  createdAt: string;
}

export type NotificationKind =
  | "like"
  | "comment"
  | "follow"
  | "repost"
  | "quote"
  | "reply"
  | "goal";

export interface Notification {
  id: string;
  kind: NotificationKind;
  actor?: User;
  feedItemId?: string;
  read: boolean;
  createdAt: string;
}

/**
 * タイムラインの1項目。feed_items テーブルに対応する。
 * type で本体を判別する「判別共用体」— FeedItemRenderer がこれでカードを出し分ける。
 */
export type FeedItem = { id: string; user: User; createdAt: string; viewer?: ViewerState } & (
  | { type: "post"; post: Post }
  | {
      type: "quote";
      post: Post;
      quoted: { user: User; body: string; workTitle?: string };
    }
  | { type: "review"; review: Review; work: Work }
  | { type: "record"; record: RecordEntry; work: Work }
  | { type: "article"; article: Article }
  | { type: "thread"; thread: Thread; board: Board }
);

export type FeedItemType = FeedItem["type"];
