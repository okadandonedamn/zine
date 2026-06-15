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
  type Collection,
  type CollectionItem,
  type Comment,
  type FeedItem,
  type FeedItemType,
  type Goal,
  type Notification,
  type QuotedFeedPreview,
  type RecordEntry,
  type Report,
  type ReportTargetType,
  type Review,
  type Thread,
  type ThreadReply,
  type User,
  type ViewerState,
  type Work,
  type WorkCategory,
  type Zine,
  type ZineItem,
} from "./types";

export { TIMELINE_CONTENT_TYPES, TIMELINE_FEEDS } from "./timeline";
export type { TimelineContentType, TimelineFeed } from "./timeline";
import type { TimelineContentType, TimelineFeed } from "./timeline";

const TIMELINE_TYPE_TO_FEED_TYPES: Record<TimelineContentType, FeedItemType[]> = {
  post: ["post", "quote", "repost"],
  article: ["article"],
  review: ["review"],
  record: ["record"],
  thread: ["thread"],
};

const ALL_PUBLIC_FEED_TYPES = Object.values(TIMELINE_TYPE_TO_FEED_TYPES).flat();

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
    role: row.role ?? "user",
  };
}

function mapWork(row: Row): Work {
  // 平均評価 = 本棚(records)に付いた星の平均(設計書v1.1 判断4)
  const ratings: number[] = (row.records ?? [])
    .map((r: Row) => r.rating)
    .filter((r: unknown) => r != null)
    .map(Number);
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
    reviewCount: row.reviews?.[0]?.count ?? 0,
    recordCount: (row.records ?? []).length,
    coverFrom: base,
    coverTo: "#15130f",
  };
}

/** レビューの星を本棚(records)から引く。キーは `${userId}:${workId}` */
async function fetchShelfRatings(rows: Row[]): Promise<Map<string, number>> {
  if (rows.length === 0) return new Map();
  const supabase = await createClient();
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const workIds = [...new Set(rows.map((r) => r.work_id))];
  const { data } = await supabase
    .from("records")
    .select("user_id, work_id, rating")
    .in("user_id", userIds)
    .in("work_id", workIds)
    .not("rating", "is", null);
  return new Map(
    (data ?? []).map((r: Row) => [`${r.user_id}:${r.work_id}`, Number(r.rating)]),
  );
}

function mapReview(row: Row, shelfRating?: number): Review {
  return {
    id: row.id,
    workId: row.work_id,
    rating: shelfRating ?? 0,
    body: row.body ?? "",
    spoiler: row.spoiler ?? false,
    axes: [...(row.review_scores ?? [])]
      .sort((a: Row, b: Row) => a.display_order - b.display_order)
      .map((s: Row) => ({ axis: s.axis_name, score: s.score })),
    tags: row.tags ?? [],
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
    rating: row.record?.rating != null ? Number(row.record.rating) : undefined,
    date: row.consumed_at,
    mode: row.entry_mode ?? "expert",
    durationMinutes: row.duration_minutes ?? undefined,
    pages: row.pages ?? undefined,
    episodes: row.episodes ?? undefined,
    tracks: row.tracks ?? undefined,
    memo: row.memo || undefined,
    comment: row.comment || undefined,
    imageUrls: row.image_urls ?? [],
    emotionTags: row.emotion_tags ?? [],
    place: row.place ?? undefined,
    focusScore: row.focus_score ?? undefined,
    satisfactionScore: row.satisfaction_score ?? undefined,
    revisitScore: row.revisit_score ?? undefined,
    customMetrics: row.custom_metrics ?? [],
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
    tags: row.tags ?? [],
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
    workId: row.work_id,
    title: row.title,
    body: row.first_reply_body ?? "",
    replyCount: row.reply_count ?? row.thread_replies?.[0]?.count ?? 0,
    createdAt: row.created_at,
    lastReplyAt: row.last_reply_at,
  };
}

const WORK_SELECT = "*, records(rating), reviews(count)";

/* =============================================================
 * タイムライン (Timeline First の核)
 * ============================================================= */

async function fetchFeed(opts: {
  types?: FeedItemType[];
  userIds?: string[];
  id?: string;
  ids?: string[];
  /** 各本体テーブルの行ID(タグ検索などで使う) */
  sourceIds?: string[];
  /** フォロー中タブ用: 人・作品・タグ付き活動のいずれかに一致(OR条件) */
  anyOf?: { userIds: string[]; workIds: string[]; sourceIds: string[] };
  depth?: number;
}): Promise<FeedItem[]> {
  const depth = opts.depth ?? 0;
  const supabase = await createClient();
  let q = supabase
    .from("feed_items")
    .select(
      `id, user_id, item_type, source_id, work_id, visibility, created_at,
       profile:profiles(*),
       likes(count), comments(count), reposts(count), bookmarks(count)`,
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);
  if (opts.types) q = q.in("item_type", opts.types);
  if (opts.userIds) q = q.in("user_id", opts.userIds);
  if (opts.id) q = q.eq("id", opts.id);
  if (opts.ids) q = q.in("id", opts.ids);
  if (opts.sourceIds) q = q.in("source_id", opts.sourceIds);
  if (opts.anyOf) {
    const parts = [
      opts.anyOf.userIds.length > 0 &&
        `user_id.in.(${opts.anyOf.userIds.join(",")})`,
      opts.anyOf.workIds.length > 0 &&
        `work_id.in.(${opts.anyOf.workIds.join(",")})`,
      opts.anyOf.sourceIds.length > 0 &&
        `source_id.in.(${opts.anyOf.sourceIds.join(",")})`,
    ].filter((p): p is string => Boolean(p));
    q = q.or(parts.join(","));
  }

  const { data: rows, error } = await q;
  if (error || !rows) return [];

  // ログイン中なら、自分が付けたいいね/ブックマーク/リポストの状態を引く
  const viewerStates = new Map<string, ViewerState>();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (authUser && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const mine = (table: string) =>
      supabase
        .from(table)
        .select("feed_item_id")
        .eq("user_id", authUser.id)
        .in("feed_item_id", ids);
    const [myLikes, myBookmarks, myReposts] = await Promise.all([
      mine("likes"),
      mine("bookmarks"),
      mine("reposts"),
    ]);
    const toSet = (res: { data: { feed_item_id: string }[] | null }) =>
      new Set((res.data ?? []).map((d) => d.feed_item_id));
    const liked = toSet(myLikes);
    const bookmarked = toSet(myBookmarks);
    const reposted = toSet(myReposts);
    for (const id of ids) {
      viewerStates.set(id, {
        liked: liked.has(id),
        bookmarked: bookmarked.has(id),
        reposted: reposted.has(id),
      });
    }
  }

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
      `*, record:records(status, work_id, rating, work:works(${WORK_SELECT}))`,
      idsOf("record"),
    ),
    fetchByIds("articles", "*, article_works(work_id)", idsOf("article")),
    fetchByIds("threads", `*, work:works(${WORK_SELECT})`, idsOf("thread")),
  ]);

  const nestedTypes = ALL_PUBLIC_FEED_TYPES;
  const quotedFeedItemIds = [
    ...new Set(
      [...posts.values()]
        .map((post) => post.quoted_feed_item_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const repostedFeedItemIds = [...new Set(idsOf("repost"))];
  const [quotedItems, repostedItems] =
    depth < 2
      ? await Promise.all([
          quotedFeedItemIds.length > 0
            ? fetchFeed({ ids: quotedFeedItemIds, types: nestedTypes, depth: depth + 1 })
            : Promise.resolve([]),
          repostedFeedItemIds.length > 0
            ? fetchFeed({ ids: repostedFeedItemIds, types: nestedTypes, depth: depth + 1 })
            : Promise.resolve([]),
        ])
      : [[], []];
  const quotedById = new Map(quotedItems.map((item) => [item.id, toQuotedFeedPreview(item)]));
  const repostedById = new Map(repostedItems.map((item) => [item.id, item]));

  // レビューの星は本棚から(判断4)
  const shelfRatings = await fetchShelfRatings([...reviews.values()]);

  const items: FeedItem[] = [];
  for (const r of rows) {
    if (!r.profile) continue;
    const base = {
      id: r.id as string,
      user: mapProfile(r.profile),
      createdAt: r.created_at as string,
      viewer: viewerStates.get(r.id),
    };
    const counts = {
      likes: r.likes?.[0]?.count ?? 0,
      comments: r.comments?.[0]?.count ?? 0,
      reposts: r.reposts?.[0]?.count ?? 0,
      bookmarks: r.bookmarks?.[0]?.count ?? 0,
    };

    if (r.item_type === "post" || r.item_type === "quote") {
      const p = posts.get(r.source_id);
      if (!p || p.deleted_at) continue; // 論理削除済みはタイムラインに出さない
      const post = {
        id: p.id,
        body: p.body,
        tags: p.tags ?? [],
        likes: counts.likes,
        reposts: counts.reposts,
        comments: counts.comments,
        bookmarks: counts.bookmarks,
      };
      if (r.item_type === "quote") {
        items.push({
          ...base,
          type: "quote",
          post,
          quoted:
            (p.quoted_feed_item_id && quotedById.get(p.quoted_feed_item_id)) ??
            missingQuotedFeedPreview(base.user),
        });
        continue;
      }
      items.push({
        ...base,
        type: "post",
        post,
      });
    } else if (r.item_type === "repost") {
      const reposted = repostedById.get(r.source_id);
      if (!reposted) continue;
      items.push({
        ...base,
        type: "repost",
        reposted,
      });
    } else if (r.item_type === "review") {
      const rv = reviews.get(r.source_id);
      if (!rv?.work) continue;
      const shelfRating = shelfRatings.get(`${rv.user_id}:${rv.work_id}`);
      items.push({
        ...base,
        type: "review",
        review: {
          ...mapReview(rv, shelfRating),
          likes: counts.likes,
          comments: counts.comments,
        },
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
      if (!t?.work || t.deleted_at) continue;
      items.push({
        ...base,
        type: "thread",
        thread: mapThread(t),
        work: mapWork(t.work),
      });
    }
    // reply / goal_achievement は将来のカード追加で対応
  }
  return items;
}

function feedItemHref(item: FeedItem): string {
  if (item.type === "post" || item.type === "quote" || item.type === "repost") {
    return `/posts/${item.id}`;
  }
  if (item.type === "record") return `/records/${item.record.id}`;
  if (item.type === "article") return `/articles/${item.article.id}`;
  if (item.type === "thread") return `/threads/${item.thread.id}`;
  return `/posts/${item.id}`;
}

function missingQuotedFeedPreview(user: User): QuotedFeedPreview {
  return {
    user,
    body: "引用元を表示できません。",
    typeLabel: "UNAVAILABLE",
    deleted: true,
  };
}

function toQuotedFeedPreview(item: FeedItem): QuotedFeedPreview {
  if (item.type === "post" || item.type === "quote") {
    return {
      user: item.user,
      body: item.post.body,
      typeLabel: item.type === "quote" ? "QUOTE" : "POST",
      href: feedItemHref(item),
    };
  }
  if (item.type === "review") {
    return {
      user: item.user,
      body: item.review.body,
      workTitle: item.work.title,
      typeLabel: "REVIEW",
      href: feedItemHref(item),
    };
  }
  if (item.type === "record") {
    return {
      user: item.user,
      body: item.record.memo ?? item.record.comment ?? "記録を公開しました。",
      workTitle: item.work.title,
      typeLabel: "RECORD",
      href: feedItemHref(item),
    };
  }
  if (item.type === "article") {
    return {
      user: item.user,
      body: item.article.excerpt || item.article.title,
      typeLabel: "ARTICLE",
      href: feedItemHref(item),
    };
  }
  if (item.type === "thread") {
    return {
      user: item.user,
      body: item.thread.body || item.thread.title,
      workTitle: item.work.title,
      typeLabel: "THREAD",
      href: feedItemHref(item),
    };
  }
  return toQuotedFeedPreview(item.reposted);
}

function feedTypesForTimelineTypes(types?: TimelineContentType[]): FeedItemType[] {
  if (!types) return ALL_PUBLIC_FEED_TYPES;
  return types.flatMap((type) => TIMELINE_TYPE_TO_FEED_TYPES[type] ?? []);
}

function isPublicFeedItem(item: FeedItem): boolean {
  if (item.type === "review") return item.review.visibility === "public";
  if (item.type === "record") return item.record.visibility === "public";
  if (item.type === "repost") return isPublicFeedItem(item.reposted);
  return true;
}

function feedItemTags(item: FeedItem): string[] {
  if (item.type === "post" || item.type === "quote") return item.post.tags;
  if (item.type === "review") return [...item.review.tags, ...item.work.tags];
  if (item.type === "article") return item.article.tags;
  if (item.type === "record" || item.type === "thread") return item.work.tags;
  if (item.type === "repost") return feedItemTags(item.reposted);
  return [];
}

function feedItemWorkId(item: FeedItem): string | undefined {
  if (item.type === "review" || item.type === "record" || item.type === "thread") {
    return item.work.id;
  }
  if (item.type === "repost") return feedItemWorkId(item.reposted);
  return undefined;
}

function feedItemCategory(item: FeedItem): WorkCategory | undefined {
  if (item.type === "review" || item.type === "record" || item.type === "thread") {
    return item.work.category;
  }
  if (item.type === "repost") return feedItemCategory(item.reposted);
  return undefined;
}

function feedItemEngagement(item: FeedItem): number {
  if (item.type === "post" || item.type === "quote") {
    return item.post.likes * 2 + item.post.comments * 3 + item.post.bookmarks;
  }
  if (item.type === "review") return item.review.likes * 2 + item.review.comments * 3;
  if (item.type === "article") return item.article.likes * 2 + item.article.comments * 3;
  if (item.type === "thread") return item.thread.replyCount * 3;
  if (item.type === "repost") return feedItemEngagement(item.reposted) + 5;
  return 0;
}

type RecommendationContext = {
  ownUserId?: string;
  followedUserIds: Set<string>;
  followedWorkIds: Set<string>;
  followedTags: string[];
  trendingTags: string[];
  preferredCategories: Set<WorkCategory>;
};

function emptyRecommendationContext(): RecommendationContext {
  return {
    followedUserIds: new Set(),
    followedWorkIds: new Set(),
    followedTags: [],
    trendingTags: [],
    preferredCategories: new Set(),
  };
}

function scoreRecommendedItem(item: FeedItem, context: RecommendationContext): number {
  let score = feedItemEngagement(item);
  const workId = feedItemWorkId(item);
  const category = feedItemCategory(item);
  const tags = feedItemTags(item);
  if (context.ownUserId && item.user.id === context.ownUserId) score -= 20;
  if (context.followedUserIds.has(item.user.id)) score += 70;
  if (workId && context.followedWorkIds.has(workId)) score += 90;
  if (category && context.preferredCategories.has(category)) score += 40;
  score += tags.filter((tag) => context.followedTags.includes(tag)).length * 55;
  const trendIndex = tags
    .map((tag) => context.trendingTags.indexOf(tag))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (trendIndex != null) score += Math.max(10, 35 - trendIndex * 5);
  const ageDays = (Date.now() - +new Date(item.createdAt)) / 86_400_000;
  if (Number.isFinite(ageDays)) score += Math.max(0, 24 - ageDays);
  return score;
}

function rankRecommendedItems(
  items: FeedItem[],
  context: RecommendationContext,
): FeedItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = scoreRecommendedItem(b, context) - scoreRecommendedItem(a, context);
    if (scoreDiff !== 0) return scoreDiff;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
}

function buildMockRecommendationContext(): RecommendationContext {
  const workMap = new Map(mock.works.map((work) => [work.id, work]));
  const mine = mock.feedItems.filter((item) => item.user.id === mock.currentUser.id);
  const followedWorkIds = new Set<string>();
  const preferredCategories = new Set<WorkCategory>();
  for (const item of mine) {
    const workId = feedItemWorkId(item);
    if (!workId) continue;
    followedWorkIds.add(workId);
    const category = workMap.get(workId)?.category;
    if (category) preferredCategories.add(category);
  }
  return {
    ownUserId: mock.currentUser.id,
    followedUserIds: new Set(mock.users.slice(1, 4).map((user) => user.id)),
    followedWorkIds,
    followedTags: mock.followedTags,
    trendingTags: buildMockTrendingTags().map((tag) => tag.tag),
    preferredCategories,
  };
}

async function fetchRecommendationContext(): Promise<RecommendationContext> {
  const me = await getCurrentUser();
  if (!me) return emptyRecommendationContext();
  const supabase = await createClient();
  const [{ data: follows }, records, works, trends] = await Promise.all([
    supabase
      .from("follows")
      .select("followee_user_id, work_id, tag:tags(name)")
      .eq("follower_id", me.id),
    getRecords(),
    getWorks(),
    getTrendingTags(),
  ]);
  const workMap = new Map(works.map((work) => [work.id, work]));
  const preferredCategories = new Set<WorkCategory>();
  for (const record of records) {
    const category = workMap.get(record.workId)?.category;
    if (category) preferredCategories.add(category);
  }
  return {
    ownUserId: me.id,
    followedUserIds: new Set(
      ((follows as Row[] | null) ?? []).map((f) => f.followee_user_id).filter(Boolean),
    ),
    followedWorkIds: new Set(
      ((follows as Row[] | null) ?? []).map((f) => f.work_id).filter(Boolean),
    ),
    followedTags: ((follows as Row[] | null) ?? [])
      .map((f) => f.tag?.name)
      .filter(Boolean),
    trendingTags: trends.map((trend) => trend.tag),
    preferredCategories,
  };
}

export async function getTimeline(
  feed: TimelineFeed,
  opts: { types?: TimelineContentType[] } = {},
): Promise<FeedItem[]> {
  const feedTypes = feedTypesForTimelineTypes(opts.types);
  if (feedTypes.length === 0) return [];

  if (!supabaseEnabled) {
    const sorted = [...mock.feedItems].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    ).filter(isPublicFeedItem);
    const typed = sorted.filter((item) => feedTypes.includes(item.type));
    if (feed === "following") {
      const ids = mock.users.slice(1, 4).map((u) => u.id);
      return typed.filter(
        (item) => ids.includes(item.user.id) || feedItemHasAnyTag(item, mock.followedTags),
      );
    }
    if (feed === "recommended") {
      return rankRecommendedItems(typed, buildMockRecommendationContext());
    }
    return typed;
  }

  if (feed === "following") {
    const me = await getCurrentUser();
    if (!me) return [];
    const supabase = await createClient();
    // 多態フォロー(人/作品/タグ)を一括で引き、三態すべてを反映する
    const { data } = await supabase
      .from("follows")
      .select("followee_user_id, work_id, tag:tags(name)")
      .eq("follower_id", me.id);
    const follows = ((data as Row[] | null) ?? []);
    const userIds = follows.map((f) => f.followee_user_id).filter(Boolean);
    const workIds = follows.map((f) => f.work_id).filter(Boolean);
    const tagNames = follows.map((f) => f.tag?.name).filter(Boolean);
    const sourceIds = await fetchTaggedSourceIds(tagNames);
    if (userIds.length + workIds.length + sourceIds.length === 0) return [];
    return fetchFeed({ types: feedTypes, anyOf: { userIds, workIds, sourceIds } });
  }

  if (feed === "recommended") {
    const [items, context] = await Promise.all([
      fetchFeed({ types: feedTypes }),
      fetchRecommendationContext(),
    ]);
    return rankRecommendedItems(items, context);
  }

  return fetchFeed({ types: feedTypes });
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

/** 自分がブックマークした活動の一覧 */
export async function getBookmarkedFeed(): Promise<FeedItem[]> {
  if (!supabaseEnabled) {
    return mock.feedItems.filter((f) => mock.bookmarkedFeedIds.includes(f.id));
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("bookmarks")
    .select("feed_item_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const ids = (data ?? []).map((b) => b.feed_item_id);
  if (ids.length === 0) return [];
  return fetchFeed({ ids });
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

/** このユーザーをフォローしている人たち */
export async function getFollowers(userId: string): Promise<User[]> {
  if (!supabaseEnabled) {
    return mock.users.filter((u) => u.id !== userId).slice(0, 3);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("follower:profiles!follows_follower_id_fkey(*)")
    .eq("followee_user_id", userId)
    .limit(100);
  return (data ?? [])
    .map((r: Row) => r.follower)
    .filter(Boolean)
    .map(mapProfile);
}

/** このユーザーがフォローしている人たち */
export async function getFollowing(userId: string): Promise<User[]> {
  if (!supabaseEnabled) {
    return mock.users.filter((u) => u.id !== userId).slice(1, 4);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("followee:profiles!follows_followee_user_id_fkey(*)")
    .eq("follower_id", userId)
    .not("followee_user_id", "is", null)
    .limit(100);
  return (data ?? [])
    .map((r: Row) => r.followee)
    .filter(Boolean)
    .map(mapProfile);
}

/** ログイン中ユーザーがこの作品をフォローしているか(多態フォロー: 作品) */
export async function isFollowingWork(workId: string): Promise<boolean> {
  if (!supabaseEnabled) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();
  return Boolean(data);
}

/* =============================================================
 * タグ(多態フォロー: タグ)
 * ============================================================= */

/** タイムライン項目にいずれかのタグが付いているか(モック用) */
function feedItemHasAnyTag(item: FeedItem, tags: string[]): boolean {
  return feedItemTags(item).some((t) => tags.includes(t));
}

/** いずれかのタグが付いた本体行のID(posts / reviews / articles) */
async function fetchTaggedSourceIds(tags: string[]): Promise<string[]> {
  if (tags.length === 0) return [];
  const supabase = await createClient();
  const { data: tagRows } = await supabase.from("tags").select("id").in("name", tags);
  const tagIds = ((tagRows as Row[] | null) ?? []).map((tag) => tag.id).filter(Boolean);
  const [posts, reviews, articles, taggings] = await Promise.all([
    supabase.from("posts").select("id").overlaps("tags", tags).is("deleted_at", null).limit(50),
    supabase.from("reviews").select("id").overlaps("tags", tags).limit(50),
    supabase.from("articles").select("id").overlaps("tags", tags).eq("status", "published").limit(50),
    tagIds.length > 0
      ? supabase
          .from("taggings")
          .select("target_id, target_type")
          .in("tag_id", tagIds)
          .in("target_type", ["post", "article", "review", "record_session"])
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);
  return [...new Set([
    ...(posts.data ?? []),
    ...(reviews.data ?? []),
    ...(articles.data ?? []),
    ...(((taggings.data as Row[] | null) ?? []).map((row) => ({ id: row.target_id }))),
  ].map((r) => r.id).filter(Boolean))];
}

/** このタグが付いた活動(短文・レビュー・記事) */
export async function getFeedByTag(tag: string): Promise<FeedItem[]> {
  if (!supabaseEnabled) {
    return mock.feedItems
      .filter((f) => feedItemHasAnyTag(f, [tag]))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
  const sourceIds = await fetchTaggedSourceIds([tag]);
  if (sourceIds.length === 0) return [];
  return fetchFeed({ sourceIds });
}

/** ログイン中ユーザーがこのタグをフォローしているか */
export async function isFollowingTag(name: string): Promise<boolean> {
  if (!supabaseEnabled) return mock.followedTags.includes(name);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (!tag) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("tag_id", tag.id)
    .maybeSingle();
  return Boolean(data);
}

/** ユーザーがフォローしているタグ名の一覧 */
export async function getFollowedTags(userId: string): Promise<string[]> {
  if (!supabaseEnabled) {
    return userId === mock.currentUser.id ? mock.followedTags : [];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select("tag:tags(name)")
    .eq("follower_id", userId)
    .not("tag_id", "is", null)
    .limit(100);
  return ((data as Row[] | null) ?? []).map((r) => r.tag?.name).filter(Boolean);
}

/* =============================================================
 * 一冊に編む(zines。Phase 7)
 * ============================================================= */

const mapZine = (row: Row): Zine => ({
  id: row.id,
  title: row.title,
  description: row.description ?? "",
  isPrivate: row.is_private ?? false,
  itemCount: row.zine_items?.[0]?.count ?? 0,
  createdAt: row.created_at,
  owner: row.owner ? mapProfile(row.owner) : undefined,
});

/** 自分の冊子一覧 */
export async function getMyZines(): Promise<Zine[]> {
  if (!supabaseEnabled) {
    return mock.zines.filter((z) => z.owner?.id === mock.currentUser.id);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("zines")
    .select("*, owner:profiles(*), zine_items(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map(mapZine);
}

/** 冊子1冊。items(記事・レビュー本体)を position 順に解決する */
export async function getZine(id: string): Promise<Zine | undefined> {
  if (!supabaseEnabled) return mock.zines.find((z) => z.id === id);
  const supabase = await createClient();
  const { data: zine } = await supabase
    .from("zines")
    .select("*, owner:profiles(*), zine_items(item_type, source_id, position)")
    .eq("id", id)
    .maybeSingle();
  if (!zine) return undefined;

  const itemRows = [...((zine.zine_items as Row[] | null) ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const idsOf = (t: string) =>
    itemRows.filter((r) => r.item_type === t).map((r) => r.source_id);
  const fetchByIds = async (table: string, select: string, ids: string[]) => {
    if (ids.length === 0) return new Map<string, Row>();
    const { data } = await supabase.from(table).select(select).in("id", ids);
    return new Map(((data as Row[] | null) ?? []).map((d) => [d.id as string, d]));
  };
  const [articleMap, reviewMap] = await Promise.all([
    fetchByIds("articles", "*, article_works(work_id)", idsOf("article")),
    fetchByIds(
      "reviews",
      `*, review_scores(axis_name, score, display_order), work:works(${WORK_SELECT})`,
      idsOf("review"),
    ),
  ]);
  const shelfRatings = await fetchShelfRatings([...reviewMap.values()]);

  const items: ZineItem[] = [];
  for (const r of itemRows) {
    if (r.item_type === "article") {
      const a = articleMap.get(r.source_id);
      if (a) items.push({ type: "article", position: r.position, article: mapArticle(a) });
    } else if (r.item_type === "review") {
      const rv = reviewMap.get(r.source_id);
      if (rv?.work)
        items.push({
          type: "review",
          position: r.position,
          review: mapReview(rv, shelfRatings.get(`${rv.user_id}:${rv.work_id}`)),
          work: mapWork(rv.work),
        });
    }
  }
  return { ...mapZine(zine), itemCount: items.length, items };
}

/** 冊子に編める自分の素材(公開済みの記事+レビュー) */
export async function getMyBindableItems(): Promise<{
  articles: Article[];
  reviews: { review: Review; work?: Work }[];
}> {
  if (!supabaseEnabled) {
    return {
      articles: mock.articles,
      reviews: mock.reviews.map((r) => ({
        review: r,
        work: mock.works.find((w) => w.id === r.workId),
      })),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { articles: [], reviews: [] };
  const [a, r] = await Promise.all([
    supabase
      .from("articles")
      .select("*, article_works(work_id)")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select(
        `*, review_scores(axis_name, score, display_order), work:works(${WORK_SELECT})`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const reviewRows = (r.data as Row[] | null) ?? [];
  const shelf = await fetchShelfRatings(reviewRows);
  return {
    articles: ((a.data as Row[] | null) ?? []).map(mapArticle),
    reviews: reviewRows.map((row) => ({
      review: mapReview(row, shelf.get(`${row.user_id}:${row.work_id}`)),
      work: row.work ? mapWork(row.work) : undefined,
    })),
  };
}

/* =============================================================
 * 通報(モデレーション)
 * ============================================================= */

/**
 * 通報一覧(/moderation 用)。RLSにより moderator 以外は自分の通報しか返らない。
 * 対象本文の抜粋とリンクをここで解決し、画面は表示に専念する。
 */
export async function getReports(): Promise<Report[]> {
  if (!supabaseEnabled) {
    return [...mock.reports].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("*, reporter:profiles!reports_reporter_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data as Row[] | null) ?? [];

  const idsOf = (t: ReportTargetType) =>
    rows.filter((r) => r.target_type === t).map((r) => r.target_id);
  const fetchMap = async (table: string, select: string, ids: string[]) => {
    if (ids.length === 0) return new Map<string, Row>();
    const { data: d } = await supabase.from(table).select(select).in("id", ids);
    return new Map(((d as Row[] | null) ?? []).map((x) => [x.id as string, x]));
  };
  const [replyMap, threadMap] = await Promise.all([
    fetchMap("thread_replies", "id, body, thread_id, number", idsOf("thread_reply")),
    fetchMap("threads", "id, title", idsOf("thread")),
  ]);

  return rows
    .filter((r) => r.reporter)
    .map((r) => {
      let excerpt = "(対象を取得できませんでした)";
      let targetHref = "/home";
      if (r.target_type === "thread_reply") {
        const reply = replyMap.get(r.target_id);
        if (reply) {
          excerpt = reply.body;
          targetHref = `/threads/${reply.thread_id}#res-${reply.number}`;
        }
      } else if (r.target_type === "thread") {
        const thread = threadMap.get(r.target_id);
        if (thread) {
          excerpt = thread.title;
          targetHref = `/threads/${r.target_id}`;
        }
      }
      return {
        id: r.id,
        reporter: mapProfile(r.reporter),
        targetType: r.target_type,
        targetId: r.target_id,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        excerpt: excerpt.slice(0, 120),
        targetHref,
      };
    });
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
  if (!data) return undefined;
  const ratings = await fetchShelfRatings([data]);
  return mapReview(data, ratings.get(`${data.user_id}:${data.work_id}`));
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
  const rows = data ?? [];
  const ratings = await fetchShelfRatings(rows);
  return rows.map((r: Row) => mapReview(r, ratings.get(`${r.user_id}:${r.work_id}`)));
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
    .select("*, record:records(status, work_id, rating)")
    .eq("user_id", me.id)
    .order("consumed_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(mapSession);
}

export async function getRecord(
  id: string,
): Promise<{ record: RecordEntry; work: Work; user?: User } | undefined> {
  if (!supabaseEnabled) {
    const record = mock.records.find((r) => r.id === id);
    const work = record ? mock.works.find((w) => w.id === record.workId) : undefined;
    if (!record || !work) return undefined;
    const feedItem = mock.feedItems.find(
      (item) => item.type === "record" && item.record.id === id,
    );
    return { record, work, user: feedItem?.user };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("record_sessions")
    .select(`*, profile:profiles(*), record:records(status, work_id, rating, work:works(${WORK_SELECT}))`)
    .eq("id", id)
    .maybeSingle();
  if (!data?.record?.work) return undefined;
  return {
    record: mapSession(data),
    work: mapWork(data.record.work),
    user: data.profile ? mapProfile(data.profile) : undefined,
  };
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
 * コレクション(作品リスト)
 * ============================================================= */

function mapCollection(row: Row): Collection {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    isPrivate: row.is_private,
    itemCount: row.collection_items?.[0]?.count ?? 0,
    createdAt: row.created_at,
    owner: row.owner ? mapProfile(row.owner) : undefined,
  };
}

const COLLECTION_SELECT = "*, collection_items(count), owner:profiles(*)";

/** 自分のコレクション(非公開も含む) */
export async function getMyCollections(): Promise<Collection[]> {
  if (!supabaseEnabled) {
    return mock.collections.filter((c) => c.owner?.id === mock.currentUser.id);
  }
  const me = await getCurrentUser();
  if (!me) return [];
  return getCollectionsByUser(me.id);
}

/** ユーザーのコレクション。他人の非公開はRLSが隠す */
export async function getCollectionsByUser(userId: string): Promise<Collection[]> {
  if (!supabaseEnabled) {
    const visible =
      userId === mock.currentUser.id
        ? mock.collections
        : mock.collections.filter((c) => !c.isPrivate);
    return visible.filter((c) => c.owner?.id === userId);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select(COLLECTION_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapCollection);
}

export async function getCollection(
  id: string,
): Promise<(Collection & { items: CollectionItem[] }) | undefined> {
  if (!supabaseEnabled) {
    const c = mock.collections.find((x) => x.id === id);
    if (!c) return undefined;
    if (c.isPrivate && c.owner?.id !== mock.currentUser.id) return undefined;
    return { ...c, items: mock.collectionItems[id] ?? [] };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select(`*, owner:profiles(*), collection_items(position, note, work:works(${WORK_SELECT}))`)
    .eq("id", id)
    .single();
  if (!data) return undefined;
  const items: CollectionItem[] = ((data.collection_items as Row[]) ?? [])
    .filter((i) => i.work)
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ work: mapWork(i.work), note: i.note ?? undefined, position: i.position }));
  return { ...mapCollection({ ...data, collection_items: undefined }), itemCount: items.length, items };
}

/** この作品を含む(閲覧可能な)コレクション */
export async function getCollectionsForWork(workId: string): Promise<Collection[]> {
  if (!supabaseEnabled) {
    return mock.collections.filter(
      (c) =>
        (mock.collectionItems[c.id] ?? []).some((i) => i.work.id === workId) &&
        (!c.isPrivate || c.owner?.id === mock.currentUser.id),
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("collection_items")
    .select(`collection:collections(${COLLECTION_SELECT})`)
    .eq("work_id", workId)
    .limit(20);
  const seen = new Set<string>();
  const result: Collection[] = [];
  for (const r of (data as Row[] | null) ?? []) {
    if (!r.collection || seen.has(r.collection.id)) continue;
    seen.add(r.collection.id);
    result.push(mapCollection(r.collection));
  }
  return result;
}

/* =============================================================
 * 語り場(スレッドは作品に従属する。boardsは存在しない)
 * ============================================================= */

export async function getThread(id: string): Promise<Thread | undefined> {
  if (!supabaseEnabled) return mock.threads.find((t) => t.id === id);
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  return data ? mapThread(data) : undefined;
}

export async function getThreadsForWork(workId: string): Promise<Thread[]> {
  if (!supabaseEnabled) return mock.threads.filter((t) => t.workId === workId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("threads")
    .select("*")
    .eq("work_id", workId)
    .is("deleted_at", null)
    .order("last_reply_at", { ascending: false });
  return (data ?? []).map(mapThread);
}

export async function getRepliesForThread(threadId: string): Promise<ThreadReply[]> {
  if (!supabaseEnabled)
    return mock.threadReplies
      .filter((r) => r.threadId === threadId)
      .map((r) => ({ ...r, viewerLiked: false }));
  const supabase = await createClient();
  // 論理削除された行も返す(レス番号の保全)。表示側で「削除済み」処理
  const { data } = await supabase
    .from("thread_replies")
    .select("*, thread_reply_likes(count)")
    .eq("thread_id", threadId)
    .order("number");
  const rows = data ?? [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const likedIds = new Set<string>();
  if (user && rows.length > 0) {
    const replyIds = rows.map((r: Row) => r.id);
    const { data: likes } = await supabase
      .from("thread_reply_likes")
      .select("reply_id")
      .eq("user_id", user.id)
      .in("reply_id", replyIds);
    for (const like of likes ?? []) likedIds.add(like.reply_id);
  }
  return rows.map((r: Row) => ({
    id: r.id,
    threadId: r.thread_id,
    number: r.number,
    name: r.display_name,
    body: r.deleted_at ? "" : r.body,
    quoteNumber: r.quote_number ?? undefined,
    likes: r.thread_reply_likes?.[0]?.count ?? 0,
    viewerLiked: likedIds.has(r.id),
    deleted: Boolean(r.deleted_at),
    createdAt: r.created_at,
  }));
}

/* =============================================================
 * コメント
 * ============================================================= */

export async function getCommentsForFeedItem(feedItemId: string): Promise<Comment[]> {
  if (!supabaseEnabled) return mock.comments[feedItemId] ?? [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, user:profiles(*)")
    .eq("feed_item_id", feedItemId)
    .is("deleted_at", null)
    .order("created_at");
  return (data ?? [])
    .filter((c: Row) => c.user)
    .map((c: Row) => ({
      id: c.id,
      body: c.body,
      user: mapProfile(c.user),
      createdAt: c.created_at,
    }));
}

/* =============================================================
 * 通知
 * ============================================================= */

export async function getNotifications(): Promise<Notification[]> {
  if (!supabaseEnabled) return mock.notifications;
  const me = await getCurrentUser();
  if (!me) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(*)")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((n: Row) => ({
    id: n.id,
    kind: n.kind,
    actor: n.actor ? mapProfile(n.actor) : undefined,
    feedItemId: n.feed_item_id ?? undefined,
    read: n.read,
    createdAt: n.created_at,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (!supabaseEnabled) return mock.notifications.filter((n) => !n.read).length;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return count ?? 0;
}

/* =============================================================
 * トレンド
 * ============================================================= */

type TrendTag = { tag: string; count: number };

function addTagCount(counts: Map<string, number>, tag: unknown, weight = 1) {
  if (typeof tag !== "string") return;
  const normalized = tag.trim().replace(/^#/, "");
  if (!normalized) return;
  counts.set(normalized, (counts.get(normalized) ?? 0) + weight);
}

function rankTagCounts(counts: Map<string, number>, limit = 6): TrendTag[] {
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"))
    .slice(0, limit);
}

function buildMockTrendingTags(): TrendTag[] {
  const counts = new Map<string, number>();
  for (const item of mock.feedItems) {
    const engagement = Math.max(1, Math.round(feedItemEngagement(item) / 20));
    for (const tag of feedItemTags(item)) addTagCount(counts, tag, engagement);
  }
  for (const tag of mock.trendingTags) {
    addTagCount(counts, tag.tag, Math.max(1, Math.round(tag.count / 100)));
  }
  return rankTagCounts(counts);
}

export async function getTrendingTags(): Promise<TrendTag[]> {
  if (!supabaseEnabled) return buildMockTrendingTags();

  const supabase = await createClient();
  const [taggings, posts, reviews, articles, works] = await Promise.all([
    supabase.from("taggings").select("tag:tags(name)").limit(500),
    supabase
      .from("posts")
      .select("tags")
      .eq("visibility", "public")
      .is("deleted_at", null)
      .limit(300),
    supabase.from("reviews").select("tags").eq("visibility", "public").limit(300),
    supabase
      .from("articles")
      .select("tags")
      .eq("status", "published")
      .eq("visibility", "public")
      .limit(300),
    supabase.from("works").select("tags").limit(300),
  ]);

  const counts = new Map<string, number>();
  for (const row of ((taggings.data as Row[] | null) ?? [])) {
    addTagCount(counts, row.tag?.name, 2);
  }
  for (const row of [
    ...((posts.data as Row[] | null) ?? []),
    ...((reviews.data as Row[] | null) ?? []),
    ...((articles.data as Row[] | null) ?? []),
    ...((works.data as Row[] | null) ?? []),
  ]) {
    for (const tag of row.tags ?? []) addTagCount(counts, tag);
  }

  const ranked = rankTagCounts(counts);
  return ranked.length > 0 ? ranked : mock.trendingTags;
}
