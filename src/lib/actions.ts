"use server";

/**
 * Server Actions: フォームからの書き込みはすべてここを通る。
 * - Supabase未設定(モックモード)では { ok: true, mock: true } を返し、UI側は従来どおり振る舞う
 * - 設定済みならRLSの下でINSERTし、DBトリガー(push_to_feed)が feed_items に流す
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseEnabled } from "./supabase/env";
import { createClient } from "./supabase/server";
import {
  findNgWord,
  NG_WORD_ERROR,
  RATE_LIMIT_SECONDS,
  rateLimitError,
  type RateLimitedTable,
} from "./safety";

export type ActionResult = { ok: true; mock?: boolean } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const NEEDS_LOGIN = "ログインが必要です。/login からサインインしてください。";

/**
 * 連投制限(安全三点セット)。直近の自分の行から十分な秒数が経っていなければ
 * エラーメッセージを返す。アプリ側の最低限の盾(safety.ts 参照)。
 */
async function checkRateLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: RateLimitedTable,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from(table)
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const limit = RATE_LIMIT_SECONDS[table];
  const elapsed = (Date.now() - +new Date(data.created_at)) / 1000;
  if (elapsed < limit) return rateLimitError(Math.ceil(limit - elapsed));
  return null;
}

/** タグ入力文字列("a, b, c")を配列に正規化 */
function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,、]/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter((t) => t.length > 0 && t.length <= 30),
    ),
  ].slice(0, 5);
}

/** 通知を作成(自分自身への通知は作らない) */
async function notify(opts: {
  userId: string;
  actorId: string;
  kind: string;
  feedItemId?: string;
}) {
  if (opts.userId === opts.actorId) return;
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: opts.userId,
    actor_id: opts.actorId,
    kind: opts.kind,
    feed_item_id: opts.feedItemId ?? null,
  });
}

/* ---------- 短文投稿 ---------- */
const postInput = z.object({
  body: z.string().min(1).max(500),
  tags: z.string(),
  visibility: z.enum(["public", "private"]),
});

export async function createPost(input: z.infer<typeof postInput>): Promise<ActionResult> {
  if (findNgWord(input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = postInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "posts", user.id);
  if (rateError) return { ok: false, error: rateError };

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body: parsed.data.body,
    tags: parseTags(parsed.data.tags),
    visibility: parsed.data.visibility,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/home");
  return { ok: true };
}

/* ---------- レビュー ---------- */
const reviewInput = z.object({
  workId: z.string().min(1),
  rating: z.number().min(0.5).max(5),
  body: z.string().min(10),
  tags: z.string().default(""),
  spoiler: z.boolean(),
  visibility: z.enum(["public", "private"]),
  axes: z
    .array(z.object({ axis: z.string().min(1).max(8), score: z.number().min(1).max(10) }))
    .length(5),
});

/**
 * 本棚(records)に星を付ける。評価の唯一の真実(設計書v1.1 判断4)。
 * 既に本棚にあれば星だけ更新し、なければ「done」として追加する。
 */
async function rateOnShelf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  workId: string,
  rating: number,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("records")
    .select("id")
    .eq("user_id", userId)
    .eq("work_id", workId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("records")
      .update({ rating, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return error?.message ?? null;
  }
  const { error } = await supabase
    .from("records")
    .insert({ user_id: userId, work_id: workId, status: "done", rating });
  return error?.message ?? null;
}

/** オンボーディング(/welcome)などからの星付け */
export async function rateWork(workId: string, rating: number): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  if (rating < 0.5 || rating > 5) return { ok: false, error: "星は0.5〜5です" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const err = await rateOnShelf(supabase, user.id, workId, rating);
  if (err) return { ok: false, error: err };
  revalidatePath(`/works/${workId}`);
  return { ok: true };
}

export async function createReview(
  input: z.infer<typeof reviewInput>,
): Promise<ActionResult> {
  if (findNgWord(input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "reviews", user.id);
  if (rateError) return { ok: false, error: rateError };

  // 星は本棚に付く(reviewsテーブルはratingを持たない)
  const shelfError = await rateOnShelf(supabase, user.id, parsed.data.workId, parsed.data.rating);
  if (shelfError) return { ok: false, error: shelfError };

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      work_id: parsed.data.workId,
      body: parsed.data.body,
      tags: parseTags(parsed.data.tags),
      spoiler: parsed.data.spoiler,
      visibility: parsed.data.visibility,
    })
    .select("id")
    .single();
  if (error || !review) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  const { error: scoresError } = await supabase.from("review_scores").insert(
    parsed.data.axes.map((a, i) => ({
      review_id: review.id,
      axis_name: a.axis,
      score: a.score,
      display_order: i,
    })),
  );
  if (scoresError) return { ok: false, error: scoresError.message };
  revalidatePath("/home");
  revalidatePath(`/works/${parsed.data.workId}`);
  return { ok: true };
}

/** 評価軸をマイテンプレートとして保存 */
export async function saveAxisTemplate(input: {
  name: string;
  axes: string[];
}): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  if (!input.name || input.axes.length !== 5)
    return { ok: false, error: "テンプレート名と5つの軸が必要です" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: tpl, error } = await supabase
    .from("review_axis_templates")
    .insert({ owner_id: user.id, name: input.name })
    .select("id")
    .single();
  if (error || !tpl) return { ok: false, error: error?.message ?? "保存に失敗しました" };
  const { error: itemsError } = await supabase
    .from("review_axis_template_items")
    .insert(input.axes.map((a, i) => ({ template_id: tpl.id, axis_name: a, display_order: i })));
  if (itemsError) return { ok: false, error: itemsError.message };
  return { ok: true };
}

/* ---------- 鑑賞記録 ---------- */
const recordInput = z.object({
  mode: z.enum(["rough", "expert"]).default("expert"),
  workId: z.string().min(1),
  status: z.enum(["want", "doing", "done", "stacked", "paused", "rewatch"]),
  date: z.string().min(1),
  durationMinutes: z.number().nullable(),
  pages: z.number().nullable(),
  episodes: z.number().nullable(),
  tracks: z.number().nullable(),
  place: z.string(),
  memo: z.string().max(300),
  comment: z.string().max(2000).default(""),
  imageUrls: z.array(z.string().url()).max(6).default([]),
  emotionTags: z.array(z.string()),
  focusScore: z.number().min(0).max(10).nullable().default(null),
  satisfactionScore: z.number().min(0).max(10).nullable().default(null),
  revisitScore: z.number().min(0).max(10).nullable().default(null),
  customMetrics: z
    .array(z.object({ label: z.string().min(1).max(20), value: z.number().min(0).max(100) }))
    .max(8)
    .default([]),
  visibility: z.enum(["public", "private"]),
});

export async function createRecordSession(
  input: z.infer<typeof recordInput>,
): Promise<ActionResult> {
  if (findNgWord(input.memo, input.comment ?? "")) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = recordInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const d = parsed.data;

  // 作品との関係(records)を upsert してから、今回のログ(record_sessions)を insert
  const { data: record, error: recordError } = await supabase
    .from("records")
    .upsert(
      {
        user_id: user.id,
        work_id: d.workId,
        status: d.status,
        visibility: d.visibility,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,work_id" },
    )
    .select("id")
    .single();
  if (recordError || !record)
    return { ok: false, error: recordError?.message ?? "保存に失敗しました" };

  const { error: sessionError } = await supabase.from("record_sessions").insert({
    record_id: record.id,
    user_id: user.id,
    consumed_at: new Date(d.date).toISOString(),
    entry_mode: d.mode,
    duration_minutes: d.durationMinutes,
    pages: d.pages,
    episodes: d.episodes,
    tracks: d.tracks,
    memo: d.memo,
    comment: d.comment,
    image_urls: d.imageUrls,
    emotion_tags: d.emotionTags,
    place: d.place || null,
    focus_score: d.focusScore,
    satisfaction_score: d.satisfactionScore,
    revisit_score: d.revisitScore,
    custom_metrics: d.customMetrics,
    visibility: d.visibility,
  });
  if (sessionError) return { ok: false, error: sessionError.message };
  revalidatePath("/home");
  revalidatePath("/records");
  revalidatePath("/records/stats");
  return { ok: true };
}

/* ---------- 語り場(スレッドは作品に従属) ---------- */
const threadInput = z.object({
  workId: z.string().min(1, "作品を選んでください"),
  title: z.string().min(5).max(60),
  body: z.string().min(10),
});

export async function createThread(
  input: z.infer<typeof threadInput>,
): Promise<ActionResult> {
  if (findNgWord(input.title, input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = threadInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "threads", user.id);
  if (rateError) return { ok: false, error: rateError };
  const d = parsed.data;

  const { data: thread, error } = await supabase
    .from("threads")
    .insert({ work_id: d.workId, user_id: user.id, title: d.title })
    .select("id")
    .single();
  if (error || !thread) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  // >>1 はDB関数で採番して投稿(§6-6)
  const { error: replyError } = await supabase.rpc("post_thread_reply", {
    p_thread_id: thread.id,
    p_body: d.body,
  });
  if (replyError) return { ok: false, error: replyError.message };
  revalidatePath(`/works/${d.workId}`);
  revalidatePath("/home");
  return { ok: true };
}

export async function createReply(input: {
  threadId: string;
  body: string;
}): Promise<ActionResult> {
  if (findNgWord(input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  if (!input.body.trim()) return { ok: false, error: "本文を入力してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "thread_replies", user.id);
  if (rateError) return { ok: false, error: rateError };

  // 「>>3」のような引用を拾う
  const quoteMatch = input.body.match(/>>(\d+)/);

  // 採番はDB関数 post_thread_reply のみが行う(count+1方式は禁止。§6-6)
  const { error } = await supabase.rpc("post_thread_reply", {
    p_thread_id: input.threadId,
    p_body: input.body,
    p_quote_number: quoteMatch ? Number(quoteMatch[1]) : null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/threads/${input.threadId}`);
  return { ok: true };
}

/* ---------- 論理削除(物理DELETEはアプリから発行しない) ---------- */

/** 自分の投稿を削除(deleted_atを立て、タイムラインからは外す) */
export async function deletePost(feedItemId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: item } = await supabase
    .from("feed_items")
    .select("source_id, item_type, user_id")
    .eq("id", feedItemId)
    .single();
  if (!item || item.user_id !== user.id)
    return { ok: false, error: "削除できるのは自分の投稿だけです" };
  if (item.item_type !== "post" && item.item_type !== "quote")
    return { ok: false, error: "この種類の活動はまだ削除に対応していません" };

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", item.source_id);
  if (error) return { ok: false, error: error.message };
  // feed_items はタイムラインの索引なので行ごと外す(本体はpostsに残る)
  await supabase.from("feed_items").delete().eq("id", feedItemId);
  revalidatePath("/home");
  return { ok: true };
}

/** 自分のレスを削除(行とレス番号は残り「削除済み」表示になる) */
export async function deleteReply(replyId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase
    .from("thread_replies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", replyId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ---------- 通報(モデレーション) ---------- */
const reportInput = z.object({
  targetType: z.enum(["thread", "thread_reply"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

/** コンテンツを通報する。処理は moderator が /moderation で行う */
export async function submitReport(
  input: z.infer<typeof reportInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = reportInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "通報理由を入力してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const handleReportInput = z.object({
  reportId: z.string().min(1),
  action: z.enum(["remove", "dismiss"]),
});

/**
 * 通報を処理する(moderator専用。reports/対象テーブルのRLSでも強制される)。
 * remove: 対象を論理削除して status='actioned' / dismiss: status='dismissed'。
 * 論理削除なのでタイムライン・スレッド表示側が自動的に「削除済み」扱いにする。
 */
export async function handleReport(
  input: z.infer<typeof handleReportInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = handleReportInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: report } = await supabase
    .from("reports")
    .select("id, target_type, target_id")
    .eq("id", parsed.data.reportId)
    .single();
  if (!report) return { ok: false, error: "通報が見つかりません" };

  if (parsed.data.action === "remove") {
    const table = report.target_type === "thread" ? "threads" : "thread_replies";
    const { error: removeError } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", report.target_id);
    if (removeError) return { ok: false, error: removeError.message };
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: parsed.data.action === "remove" ? "actioned" : "dismissed",
      handled_by: user.id,
    })
    .eq("id", report.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/moderation");
  return { ok: true };
}

/* ---------- 記事 ---------- */
const articleInput = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(50),
  tags: z.string().default(""),
  relatedWorkId: z.string(),
  status: z.enum(["draft", "published"]),
});

export async function createArticle(
  input: z.infer<typeof articleInput>,
): Promise<ActionResult> {
  if (findNgWord(input.title, input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = articleInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "articles", user.id);
  if (rateError) return { ok: false, error: rateError };
  const d = parsed.data;

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      user_id: user.id,
      title: d.title,
      body: d.body,
      tags: parseTags(d.tags),
      status: d.status,
      published_at: d.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !article) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  if (d.relatedWorkId) {
    await supabase
      .from("article_works")
      .insert({ article_id: article.id, work_id: d.relatedWorkId });
  }
  revalidatePath("/home");
  return { ok: true };
}

/* ---------- プロフィール ---------- */
const profileInput = z.object({
  displayName: z.string().min(1).max(30),
  username: z
    .string()
    .regex(/^[a-z0-9_]{3,20}$/, "ユーザー名は半角英数と_で3〜20文字"),
  bio: z.string().max(200),
});

export async function updateProfile(
  input: z.infer<typeof profileInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = profileInput.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username: parsed.data.username,
      bio: parsed.data.bio,
    })
    .eq("id", user.id);
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "そのユーザー名は既に使われています" };
    return { ok: false, error: error.message };
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateAvatarUrl(url: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

/* ---------- 作品登録 ---------- */
const workInput = z.object({
  title: z.string().min(1).max(100),
  category: z.enum([
    "film",
    "music",
    "literature",
    "art",
    "fashion",
    "exhibition",
    "stage",
    "game",
    "other",
  ]),
  creator: z.string().max(100),
  year: z.number().int().min(0).max(2100).nullable(),
  description: z.string().max(1000),
});

export async function createWork(
  input: z.infer<typeof workInput>,
): Promise<{ ok: true; mock?: boolean; id?: string } | { ok: false; error: string }> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = workInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data, error } = await supabase
    .from("works")
    .insert({
      title: parsed.data.title,
      category: parsed.data.category,
      creator: parsed.data.creator,
      year: parsed.data.year,
      description: parsed.data.description,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "保存に失敗しました" };
  revalidatePath("/works");
  return { ok: true, id: data.id };
}

/* ---------- コレクション(作品リスト) ---------- */
const collectionInput = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(300),
  isPrivate: z.boolean(),
});

export async function createCollection(
  input: z.infer<typeof collectionInput>,
): Promise<{ ok: true; mock?: boolean; id?: string } | { ok: false; error: string }> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = collectionInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data, error } = await supabase
    .from("collections")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      is_private: parsed.data.isPrivate,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "保存に失敗しました" };
  revalidatePath("/collections");
  return { ok: true, id: data.id };
}

/** 作品をコレクションの末尾に加える */
export async function addToCollection(input: {
  collectionId: string;
  workId: string;
  note?: string;
}): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  // 並び順は同一ユーザーの操作しか起きないため、件数から採番してよい
  // (レス番号のような競合条件は無い)
  const { count } = await supabase
    .from("collection_items")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", input.collectionId);

  const { error } = await supabase.from("collection_items").insert({
    collection_id: input.collectionId,
    work_id: input.workId,
    position: count ?? 0,
    note: input.note?.trim() || null,
  });
  if (error) {
    if (error.code === "23505")
      return { ok: false, error: "この作品はすでに入っています" };
    return { ok: false, error: error.message };
  }
  revalidatePath(`/collections/${input.collectionId}`);
  revalidatePath(`/works/${input.workId}`);
  return { ok: true };
}

export async function removeFromCollection(input: {
  collectionId: string;
  workId: string;
}): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("collection_id", input.collectionId)
    .eq("work_id", input.workId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/collections/${input.collectionId}`);
  return { ok: true };
}

/** コレクションを削除(作品リストの索引なので物理削除でよい。投稿の論理削除とは別物) */
export async function deleteCollection(collectionId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId)
    .eq("owner_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/collections");
  return { ok: true };
}

/* ---------- 一冊に編む(zines。Phase 7) ---------- */
const zineInput = z.object({
  title: z.string().min(1).max(60),
  description: z.string().max(500).default(""),
  isPrivate: z.boolean().default(false),
  items: z
    .array(
      z.object({
        type: z.enum(["article", "review"]),
        sourceId: z.string().min(1),
      }),
    )
    .min(1)
    .max(50),
});

/** 自分の記事・レビューを選んで一冊に編む(選んだ順がページ順になる) */
export async function createZine(
  input: z.infer<typeof zineInput>,
): Promise<{ ok: true; mock?: boolean; id?: string } | { ok: false; error: string }> {
  if (findNgWord(input.title, input.description))
    return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = zineInput.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "題と素材(1つ以上)を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const d = parsed.data;

  // 編めるのは自分の素材だけ(他人の記事を冊子に取り込ませない)
  const ids = (t: "article" | "review") =>
    d.items.filter((i) => i.type === t).map((i) => i.sourceId);
  const [mineArticles, mineReviews] = await Promise.all([
    ids("article").length > 0
      ? supabase.from("articles").select("id").eq("user_id", user.id).in("id", ids("article"))
      : Promise.resolve({ data: [] as { id: string }[] }),
    ids("review").length > 0
      ? supabase.from("reviews").select("id").eq("user_id", user.id).in("id", ids("review"))
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);
  const owned = new Set(
    [...(mineArticles.data ?? []), ...(mineReviews.data ?? [])].map((r) => r.id),
  );
  if (d.items.some((i) => !owned.has(i.sourceId)))
    return { ok: false, error: "自分の記事・レビューだけを編めます" };

  const { data: zine, error } = await supabase
    .from("zines")
    .insert({
      owner_id: user.id,
      title: d.title,
      description: d.description,
      is_private: d.isPrivate,
    })
    .select("id")
    .single();
  if (error || !zine) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  // 並び順は選んだ順。所有者しか書かないため添字採番でよい(コレクションと同じ)
  const { error: itemsError } = await supabase.from("zine_items").insert(
    d.items.map((i, index) => ({
      zine_id: zine.id,
      item_type: i.type,
      source_id: i.sourceId,
      position: index,
    })),
  );
  if (itemsError) return { ok: false, error: itemsError.message };
  revalidatePath("/zines");
  return { ok: true, id: zine.id };
}

/** 冊子を削除(索引なので物理削除でよい。本体の記事・レビューは残る) */
export async function deleteZine(zineId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const { error } = await supabase
    .from("zines")
    .delete()
    .eq("id", zineId)
    .eq("owner_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/zines");
  return { ok: true };
}

/* ---------- リアクション(いいね / ブックマーク / リポスト) ---------- */

async function toggleReaction(
  table: "likes" | "bookmarks" | "reposts",
  feedItemId: string,
  notifyKind?: string,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: existing } = await supabase
    .from(table)
    .select("feed_item_id")
    .eq("user_id", user.id)
    .eq("feed_item_id", feedItemId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from(table)
      .delete()
      .eq("user_id", user.id)
      .eq("feed_item_id", feedItemId);
  } else {
    const { error } = await supabase
      .from(table)
      .insert({ user_id: user.id, feed_item_id: feedItemId });
    if (error) return { ok: false, error: error.message };
    if (notifyKind) {
      const { data: item } = await supabase
        .from("feed_items")
        .select("user_id")
        .eq("id", feedItemId)
        .single();
      if (item)
        await notify({
          userId: item.user_id,
          actorId: user.id,
          kind: notifyKind,
          feedItemId,
        });
    }
  }
  return { ok: true };
}

export async function toggleLike(feedItemId: string): Promise<ActionResult> {
  return toggleReaction("likes", feedItemId, "like");
}

export async function toggleBookmark(feedItemId: string): Promise<ActionResult> {
  return toggleReaction("bookmarks", feedItemId);
}

export async function toggleRepost(feedItemId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: item, error: itemError } = await supabase
    .from("feed_items")
    .select("id, user_id, work_id, visibility")
    .eq("id", feedItemId)
    .maybeSingle();
  if (itemError) return { ok: false, error: itemError.message };
  if (!item) return { ok: false, error: "Feed item not found." };
  if (item.visibility !== "public") {
    return { ok: false, error: "公開されている活動だけリポストできます。" };
  }

  const { data: existing } = await supabase
    .from("reposts")
    .select("feed_item_id")
    .eq("user_id", user.id)
    .eq("feed_item_id", feedItemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reposts")
      .delete()
      .eq("user_id", user.id)
      .eq("feed_item_id", feedItemId);
    if (error) return { ok: false, error: error.message };
    await supabase
      .from("feed_items")
      .delete()
      .eq("user_id", user.id)
      .eq("item_type", "repost")
      .eq("source_id", feedItemId);
  } else {
    const { error } = await supabase
      .from("reposts")
      .insert({ user_id: user.id, feed_item_id: feedItemId });
    if (error) return { ok: false, error: error.message };

    const { error: feedError } = await supabase.from("feed_items").insert({
      user_id: user.id,
      item_type: "repost",
      source_id: feedItemId,
      work_id: item.work_id ?? null,
      visibility: "public",
    });
    if (feedError) {
      await supabase
        .from("reposts")
        .delete()
        .eq("user_id", user.id)
        .eq("feed_item_id", feedItemId);
      return { ok: false, error: feedError.message };
    }

    await notify({
      userId: item.user_id,
      actorId: user.id,
      kind: "repost",
      feedItemId,
    });
  }

  revalidatePath("/home");
  revalidatePath("/posts");
  revalidatePath(`/posts/${feedItemId}`);
  return { ok: true };
}

export async function toggleThreadReplyLike(replyId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: reply, error: replyError } = await supabase
    .from("thread_replies")
    .select("id, thread_id, deleted_at")
    .eq("id", replyId)
    .maybeSingle();
  if (replyError) return { ok: false, error: replyError.message };
  if (!reply) return { ok: false, error: "Reply not found." };
  if (reply.deleted_at) return { ok: false, error: "Deleted replies cannot be liked." };

  const { data: existing } = await supabase
    .from("thread_reply_likes")
    .select("reply_id")
    .eq("user_id", user.id)
    .eq("reply_id", replyId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("thread_reply_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("reply_id", replyId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("thread_reply_likes")
      .insert({ user_id: user.id, reply_id: replyId });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/threads/${reply.thread_id}`);
  return { ok: true };
}

/* ---------- コメント ---------- */

export async function createComment(input: {
  feedItemId: string;
  body: string;
}): Promise<ActionResult> {
  if (findNgWord(input.body)) return { ok: false, error: NG_WORD_ERROR };
  if (!supabaseEnabled) return { ok: true, mock: true };
  const body = input.body.trim();
  if (!body || body.length > 500)
    return { ok: false, error: "コメントは1〜500文字で入力してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const rateError = await checkRateLimit(supabase, "comments", user.id);
  if (rateError) return { ok: false, error: rateError };

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    feed_item_id: input.feedItemId,
    body,
  });
  if (error) return { ok: false, error: error.message };

  const { data: item } = await supabase
    .from("feed_items")
    .select("user_id")
    .eq("id", input.feedItemId)
    .single();
  if (item)
    await notify({
      userId: item.user_id,
      actorId: user.id,
      kind: "comment",
      feedItemId: input.feedItemId,
    });
  revalidatePath(`/posts/${input.feedItemId}`);
  return { ok: true };
}

/* ---------- 通知 ---------- */

export async function markNotificationsRead(): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/notifications");
  return { ok: true };
}

/* ---------- フォロー(人 / 作品 / タグ の多態) ---------- */
export async function toggleFollow(followeeId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  if (user.id === followeeId) return { ok: false, error: "自分はフォローできません" };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("followee_user_id", followeeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_user_id: followeeId });
    if (error) return { ok: false, error: error.message };
    await notify({ userId: followeeId, actorId: user.id, kind: "follow" });
  }
  revalidatePath("/home");
  return { ok: true };
}

/** タグをフォローする。tags テーブルに無ければ作ってからフォローする */
export async function toggleTagFollow(name: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const tagName = name.trim().replace(/^#/, "");
  if (!tagName || tagName.length > 30)
    return { ok: false, error: "タグ名が正しくありません" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  let { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("name", tagName)
    .maybeSingle();
  if (!tag) {
    const { data: created, error } = await supabase
      .from("tags")
      .insert({ name: tagName })
      .select("id")
      .single();
    if (error) {
      // 同時作成で先を越されたら引き直す
      if (error.code === "23505") {
        ({ data: tag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .maybeSingle());
      }
      if (!tag) return { ok: false, error: error.message };
    } else {
      tag = created;
    }
  }
  if (!tag) return { ok: false, error: "タグを作成できませんでした" };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("tag_id", tag.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, tag_id: tag.id });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/tags/${encodeURIComponent(tagName)}`);
  return { ok: true };
}

/** 作品をフォローする(新しいレビュー・スレッドを追うため) */
export async function toggleWorkFollow(workId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, work_id: workId });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/works/${workId}`);
  return { ok: true };
}
