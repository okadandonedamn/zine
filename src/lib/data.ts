/**
 * データアクセス層。
 * 画面コンポーネント(サーバー側)は必ずこのファイルの関数経由でデータを取得する。
 *
 * - Supabaseの環境変数が設定されていれば → Supabaseに問い合わせる
 * - 設定されていなければ → mock-data.ts にフォールバック
 *
 * 関数のシグネチャは両モードで同一なので、画面側はモードを意識しない。
 */
import { supabaseEnabled } from "./supabase/env";
import { createClient } from "./supabase/server";
import * as mock from "./mock-data";
import {
  CATEGORY_COLORS,
  type Article,
  type Board,
  type FeedItem,
  type FeedItemType,
  type Goal,
  type RecordEntry,
  type Review,
  type Thread,
  type ThreadReply,
  type User,
  type Work,
  type WorkCategory,
} from "./types";

export { TIMELINE_TABS } from "./timeline";
export type { TimelineTab } from "./timeline";
import type { TimelineTab } from "./timeline";

const TAB_TYPE_FILTER: Partial<Record<TimelineTab, FeedItemType[]>> = {
  reviews: ["review"],
  records: ["record"],
  discussions: ["thread"],
  articles: ["article"],
};

/* =============================================================
 * マッピングヘルパー: Supabaseの行 → アプリのドメイン型
 * ============================================================= */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function hueFromString(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function mapProfile(row: Row): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio ?? "",
    avatarHue: hueFromString(row.username ?? ""),
    avatarUrl: row.avatar_url ?? undefined,
    followers: row.followers ?? 0,
    following: row.following ?? 0,
  };
}

function mapWork(row: Row): Work {
  const ratings: number[] = (row.reviews ?? []).map((r: Row) => Number(r.rating));
  const avg =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;
  const base = CATEGORY_COLORS[(row.category as WorkCategory) ?? "other"];
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    creator: row.creator ?? "",
    year: row.year ?? 0,
    description: row.description ?? "",
    tags: [],
    avgRating: avg,
    reviewCount: ratings.length,
    recordCount: row.records?.[0]?.count ?? 0,
    coverFrom: base,
    coverTo: "#15130f",
  };
}

function mapReview(row: Row): Review {
  return {
    id: row.id,
    workId: row.work_id,
    rating: Number(row.rating),
    body: row.body ?? "",
    spoiler: row.spoiler ?? false,
    axes: [...(row.review_scores ?? [])]
      .sort((a: Row, b: Row) => a.display_order - b.display_order)
      .map((s: Row) => ({ axis: s.axis_name, score: s.score })),
    tags: [],
    likes: 0,
    comments: 0,
    visibility: row.visibility,
    author: row.author ? mapProfile(row.author) : undefined,
  };
}

function mapSession(row: Row): RecordEntry {
  return {
    id: row.id,
    workId: row.record?.work_id ?? row.record?.work?.id ?? "",
    status: row.record?.status ?? "done",
    date: row.consumed_at,
    durationMinutes: row.duration_minutes ?? undefined,
    pages: row.pages ?? undefined,
    episodes: row.episodes ?? undefined,
    tracks: row.tracks ?? undefined,
    memo: row.memo || undefined,
    emotionTags: row.emotion_tags ?? [],
    place: row.place ?? undefined,
    visibility: row.visibility,
  };
}

function mapArticle(row: Row): Article {
  const body: string = row.body ?? "";
  return {
    id: row.id,
    title: row.title,
    excerpt: body.split("\n\n")[0]?.slice(0, 120) ?? "",
    body,
    tags: [],
    readMinutes: Math.max(1, Math.round(body.length / 600)),
    likes: 0,
    comments: 0,
    coverFrom: "#3a3a3a",
    coverTo: "#121212",
    relatedWorkIds: (row.article_works ?? []).map((w: Row) => w.work_id),
    author: row.author ? mapProfile(row.author) : undefined,
  };
}

function mapThread(row: Row): Thread {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    body: row.first_reply_body ?? "",
    replyCount: row.thread_replies?.[0]?.count ?? 0,
    anonymous: row.anonymous ?? false,
    workId: row.work_id ?? undefined,
    createdAt: row.created_at,
    lastReplyAt: row.last_reply_at,
  };
}

function mapBoard(row: Row): Board {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: row.category ?? "general",
    threadCount: row.threads?.[0]?.count ?? 0,
  };
}

const WORK_SELECT = "*, reviews(rating), records(count)";

/* =============================================================
 * タイムライン (Timeline First の核)
 * ============================================================= */

async function fetchFeed(opts: {
  types?: FeedItemType[];
  userIds?: string[];
  id?: string;
}): Promise<FeedItem[]> {
  const supabase = await createClient();
  let q = supabase
    .from("feed_items")
    .select(
      `id, user_id, item_type, source_id, work_id, visibility, created_at,
       profile:profiles(*),
       likes(count), comments(count), reposts(count), bookmarks(count)`,
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (opts.types) q = q.in("item_type", opts.types);
  if (opts.userIds) q = q.in("user_id", opts.userIds);
  if (opts.id) q = q.eq("id", opts.id);

  const { data: rows, error } = await q;
  if (error || !rows) return [];

  const idsOf = (t: string) =>
    rows.filter((r) => r.item_type === t).map((r) => r.source_id);

  const fetchByIds = async (table: string, select: string, ids: string[]) => {
    if (ids.length === 0) return new Map<string, Row>();
    const { data } = await supabase.from(table).select(select).in("id", ids);
    return new Map(((data as Row[] | null) ?? []).map((d) => [d.id as string, d]));
  };

  const [posts, reviews, sessions, articles, threads] = await Promise.all([
    fetchByIds("posts", "*", [...idsOf("post"), ...idsOf("quote")]),
    fetchByIds(
      "reviews",
      `*, review_scores(axis_name, score, display_order), work:works(${WORK_SELECT})`,
      idsOf("review"),
    ),
    fetchByIds(
      "record_sessions",
      `*, record:records(status, work_id, work:works(${WORK_SELECT}))`,
      idsOf("record"),
    ),
    fetchByIds("articles", "*, article_works(work_id)", idsOf("article")),
    fetchByIds(
      "threads",
      "*, board:boards(*, threads(count)), thread_replies(count)",
      idsOf("thread"),
    ),
  ]);

  const items: FeedItem[] = [];
  for (const r of rows) {
    if (!r.profile) continue;
    const base = {
      id: r.id as string,
      user: mapProfile(r.profile),
      createdAt: r.created_at as string,
    };
    const counts = {
      likes: r.likes?.[0]?.count ?? 0,
      comments: r.comments?.[0]?.count ?? 0,
      reposts: r.reposts?.[0]?.count ?? 0,
      bookmarks: r.bookmarks?.[0]?.count ?? 0,
    };

    if (r.item_type === "post" || r.item_type === "quote") {
      const p = posts.get(r.source_id);
      if (!p) continue;
      items.push({
        ...base,
        type: "post",
        post: {
          id: p.id,
          body: p.body,
          tags: [],
          likes: counts.likes,
          reposts: counts.reposts,
          comments: counts.comments,
          bookmarks: counts.bookmarks,
        },
      });
    } else if (r.item_type === "review") {
      const rv = reviews.get(r.source_id);
      if (!rv?.work) continue;
      items.push({
        ...base,
        type: "review",
        review: { ...mapReview(rv), likes: counts.likes, comments: counts.comments },
        work: mapWork(rv.work),
      });
    } else if (r.item_type === "record") {
      const s = sessions.get(r.source_id);
      if (!s?.record?.work) continue;
      items.push({
        ...base,
        type: "record",
        record: mapSession(s),
        work: mapWork(s.record.work),
      });
    } else if (r.item_type === "article") {
      const a = articles.get(r.source_id);
      if (!a) continue;
      items.push({
        ...base,
        type: "article",
        article: { ...mapArticle(a), likes: counts.likes, comments: counts.comments },
      });
    } else if (r.item_type === "thread") {
      const t = threads.get(r.source_id);
      if (!t?.board) continue;
      items.push({
        ...base,
        type: "thread",
        thread: mapThread(t),
        board: mapBoard(t.board),
      });
    }
    // reply / repost / goal_achievement は将来のカード追加で対応
  }
  return items;
}

export async function getTimeline(tab: TimelineTab): Promise<FeedItem[]> {
  if (!supabaseEnabled) {
    const sorted = [...mock.feedItems].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
    const filter = TAB_TYPE_FILTER[tab];
    if (filter) return sorted.filter((i) => filter.includes(i.type));
    if (tab === "following") {
      const ids = mock.users.slice(1, 4).map((u) => u.id);
      return sorted.filter((i) => ids.includes(i.user.id));
    }
    return sorted;
  }

  if (tab === "following") {
    const me = await getCurrentUser();
    if (!me) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", me.id);
    const ids = (data ?? []).map((f) => f.followee_id);
    if (ids.length === 0) return [];
    return fetchFeed({ userIds: ids });
  }
  return fetchFeed({ types: TAB_TYPE_FILTER[tab] });
}

export async function getUserFeed(
  userId: string,
  type?: FeedItemType,
): Promise<FeedItem[]> {
  if (!supabaseEnabled) {
    return mock.feedItems
      .filter((f) => f.user.id === userId && (!type || f.type === type))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  return fetchFeed({ userIds: [userId], types: type ? [type] : undefined });
}

export async function getFeedItem(id: string): Promise<FeedItem | undefined> {
  if (!supabaseEnabled) return mock.feedItems.find((f) => f.id === id);
  const items = await fetchFeed({ id });
  return items[0];
}

/* =============================================================
 * ユーザー
 * ============================================================= */

/** ログイン中のユーザー。モックモードでは固定ユーザー、Supabaseで未ログインなら null */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabaseEnabled) return mock.currentUser;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return profile ? mapProfile(profile) : null;
}

export async function getUsers(): Promise<User[]> {
  if (!supabaseEnabled) return mock.users;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").limit(10);
  return (data ?? []).map(mapProfile);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  if (!supabaseEnabled) return mock.users.find((u) => u.username === username);
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();
  if (!profile) return undefined;
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
  ]);
  return { ...mapProfile(profile), followers: followers ?? 0, following: following ?? 0 };
}

/* =============================================================
 * 作品
 * ============================================================= */

export async function getWorks(): Promise<Work[]> {
  if (!supabaseEnabled) return mock.works;
  const supabase = await createClient();
  const { data } = await supabase.from("works").select(WORK_SELECT).order("title");
  return (data ?? []).map(mapWork);
}

export async function getWork(id: string): Promise<Work | undefined> {
  if (!supabaseEnabled) return mock.works.find((w) => w.id === id);
  const supabase = await createClient();
  const { data } = await supabase.from("works").select(WORK_SELECT).eq("id", id).single();
  return data ? mapWork(data) : undefined;
}

/* =============================================================
 * レビュー
 * ============================================================= */

const REVIEW_SELECT =
  "*, review_scores(axis_name, score, display_order), author:profiles(*)";

export async function getReview(id: string): Promise<Review | undefined> {
  if (!supabaseEnabled) {
    const r = mock.reviews.find((x) => x.id === id);
    if (!r) return undefined;
    const feedItem = mock.feedItems.find((f) => f.type === "review" && f.review.id === id);
    return { ...r, author: feedItem?.user };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select(REVIEW_SELECT).eq("id", id).single();
  return data ? mapReview(data) : undefined;
}

export async function getReviewsForWork(workId: string): Promise<Review[]> {
  if (!supabaseEnabled) {
    return mock.reviews
      .filter((r) => r.workId === workId)
      .map((r) => ({
        ...r,
        author: mock.feedItems.find((f) => f.type === "review" && f.review.id === r.id)
          ?.user,
      }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("work_id", workId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapReview);
}

/* =============================================================
 * 記事
 * ============================================================= */

export async function getArticle(id: string): Promise<Article | undefined> {
  if (!supabaseEnabled) {
    const a = mock.articles.find((x) => x.id === id);
    if (!a) return undefined;
    const feedItem = mock.feedItems.find((f) => f.type === "article" && f.article.id === id);
    return { ...a, author: feedItem?.user };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*, article_works(work_id), author:profiles(*)")
    .eq("id", id)
    .single();
  return data ? mapArticle(data) : undefined;
}

export async function getArticlesForWork(workId: string): Promise<Article[]> {
  if (!supabaseEnabled)
    return mock.articles.filter((a) => a.relatedWorkIds.includes(workId));
  const supabase = await createClient();
  const { data } = await supabase
    .from("article_works")
    .select("article:articles(*, article_works(work_id))")
    .eq("work_id", workId);
  return (data ?? [])
    .map((r: Row) => r.article)
    .filter(Boolean)
    .map(mapArticle);
}

/* =============================================================
 * 鑑賞記録(ログイン中ユーザーの記録)
 * ============================================================= */

export async function getRecords(): Promise<RecordEntry[]> {
  if (!supabaseEnabled) return mock.records;
  const me = await getCurrentUser();
  if (!me) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("record_sessions")
    .select("*, record:records(status, work_id)")
    .eq("user_id", me.id)
    .order("consumed_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(mapSession);
}

export async function getRecordsForWork(workId: string): Promise<RecordEntry[]> {
  if (!supabaseEnabled) return mock.records.filter((r) => r.workId === workId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("records")
    .select("id, status, work_id, updated_at, visibility")
    .eq("work_id", workId);
  return (data ?? []).map((r: Row) => ({
    id: r.id,
    workId: r.work_id,
    status: r.status,
    date: r.updated_at,
    emotionTags: [],
    visibility: r.visibility,
  }));
}

/* =============================================================
 * 目標・連続記録
 * ============================================================= */

export async function getGoals(): Promise<Goal[]> {
  if (!supabaseEnabled) return mock.goals;
  const me = await getCurrentUser();
  if (!me) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*, goal_progress(current)")
    .eq("user_id", me.id);
  return (data ?? []).map((g: Row) => ({
    id: g.id,
    title: g.title,
    category: g.category ?? "all",
    period: g.period,
    target: g.target,
    unit: g.unit,
    current: (g.goal_progress ?? []).reduce((s: number, p: Row) => s + p.current, 0),
  }));
}

export async function getStreak(): Promise<number> {
  if (!supabaseEnabled) return mock.streakDays;
  const me = await getCurrentUser();
  if (!me) return 0;
  const supabase = await createClient();
  const { data } = await supabase
    .from("streaks")
    .select("current_days")
    .eq("user_id", me.id)
    .single();
  return data?.current_days ?? 0;
}

/* =============================================================
 * 掲示板
 * ============================================================= */

export async function getBoards(): Promise<Board[]> {
  if (!supabaseEnabled) return mock.boards;
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("*, threads(count)")
    .order("display_order");
  return (data ?? []).map(mapBoard);
}

export async function getBoard(id: string): Promise<Board | undefined> {
  if (!supabaseEnabled) return mock.boards.find((b) => b.id === id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("*, threads(count)")
    .eq("id", id)
    .single();
  return data ? mapBoard(data) : undefined;
}

export async function getThread(id: string): Promise<Thread | undefined> {
  if (!supabaseEnabled) return mock.threads.find((t) => t.id === id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*, thread_replies(count)")
    .eq("id", id)
    .single();
  return data ? mapThread(data) : undefined;
}

export async function getThreadsForBoard(boardId: string): Promise<Thread[]> {
  if (!supabaseEnabled) return mock.threads.filter((t) => t.boardId === boardId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*, thread_replies(count)")
    .eq("board_id", boardId)
    .order("last_reply_at", { ascending: false });
  return (data ?? []).map(mapThread);
}

export async function getThreadsForWork(workId: string): Promise<Thread[]> {
  if (!supabaseEnabled) return mock.threads.filter((t) => t.workId === workId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*, thread_replies(count)")
    .eq("work_id", workId);
  return (data ?? []).map(mapThread);
}

export async function getRepliesForThread(threadId: string): Promise<ThreadReply[]> {
  if (!supabaseEnabled) return mock.threadReplies.filter((r) => r.threadId === threadId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("thread_replies")
    .select("*, thread_reply_likes(count)")
    .eq("thread_id", threadId)
    .order("number");
  return (data ?? []).map((r: Row) => ({
    id: r.id,
    threadId: r.thread_id,
    number: r.number,
    name: r.display_name,
    body: r.body,
    quoteNumber: r.quote_number ?? undefined,
    likes: r.thread_reply_likes?.[0]?.count ?? 0,
    createdAt: r.created_at,
  }));
}

/* =============================================================
 * トレンド(v1は固定。将来taggings集計に置換)
 * ============================================================= */

export async function getTrendingTags() {
  return mock.trendingTags;
}
