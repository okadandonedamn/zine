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

export type ActionResult = { ok: true; mock?: boolean } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const NEEDS_LOGIN = "ログインが必要です。/login からサインインしてください。";

/* ---------- 短文投稿 ---------- */
const postInput = z.object({
  body: z.string().min(1).max(500),
  visibility: z.enum(["public", "private"]),
});

export async function createPost(input: z.infer<typeof postInput>): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = postInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    body: parsed.data.body,
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
  spoiler: z.boolean(),
  visibility: z.enum(["public", "private"]),
  axes: z
    .array(z.object({ axis: z.string().min(1).max(8), score: z.number().min(1).max(10) }))
    .length(5),
});

export async function createReview(
  input: z.infer<typeof reviewInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      work_id: parsed.data.workId,
      rating: parsed.data.rating,
      body: parsed.data.body,
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
  workId: z.string().min(1),
  status: z.enum(["want", "doing", "done", "stacked", "paused", "rewatch"]),
  date: z.string().min(1),
  durationMinutes: z.number().nullable(),
  pages: z.number().nullable(),
  episodes: z.number().nullable(),
  tracks: z.number().nullable(),
  place: z.string(),
  memo: z.string().max(300),
  emotionTags: z.array(z.string()),
  visibility: z.enum(["public", "private"]),
});

export async function createRecordSession(
  input: z.infer<typeof recordInput>,
): Promise<ActionResult> {
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
    duration_minutes: d.durationMinutes,
    pages: d.pages,
    episodes: d.episodes,
    tracks: d.tracks,
    memo: d.memo,
    emotion_tags: d.emotionTags,
    place: d.place || null,
    visibility: d.visibility,
  });
  if (sessionError) return { ok: false, error: sessionError.message };
  revalidatePath("/home");
  revalidatePath("/records");
  return { ok: true };
}

/* ---------- スレッド ---------- */
const threadInput = z.object({
  boardId: z.string().min(1),
  title: z.string().min(5).max(60),
  body: z.string().min(10),
  workId: z.string(),
  anonymous: z.boolean(),
});

export async function createThread(
  input: z.infer<typeof threadInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = threadInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const d = parsed.data;

  const { data: thread, error } = await supabase
    .from("threads")
    .insert({
      board_id: d.boardId,
      user_id: user.id,
      work_id: d.workId || null,
      title: d.title,
      anonymous: d.anonymous,
    })
    .select("id")
    .single();
  if (error || !thread) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  const name = d.anonymous ? "名無しの批評家" : await displayNameOf(user.id);
  const { error: replyError } = await supabase.from("thread_replies").insert({
    thread_id: thread.id,
    user_id: user.id,
    number: 1,
    display_name: name,
    body: d.body,
  });
  if (replyError) return { ok: false, error: replyError.message };
  revalidatePath("/boards");
  revalidatePath("/home");
  return { ok: true };
}

export async function createReply(input: {
  threadId: string;
  body: string;
  anonymous: boolean;
}): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  if (!input.body.trim()) return { ok: false, error: "本文を入力してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };

  const { data: last } = await supabase
    .from("thread_replies")
    .select("number")
    .eq("thread_id", input.threadId)
    .order("number", { ascending: false })
    .limit(1)
    .single();
  const number = (last?.number ?? 0) + 1;

  // 「>>3」のような引用を拾う
  const quoteMatch = input.body.match(/>>(\d+)/);
  const name = input.anonymous ? "名無しの批評家" : await displayNameOf(user.id);

  const { error } = await supabase.from("thread_replies").insert({
    thread_id: input.threadId,
    user_id: user.id,
    number,
    display_name: name,
    body: input.body,
    quote_number: quoteMatch ? Number(quoteMatch[1]) : null,
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("threads")
    .update({ last_reply_at: new Date().toISOString() })
    .eq("id", input.threadId);
  revalidatePath(`/threads/${input.threadId}`);
  return { ok: true };
}

/* ---------- 記事 ---------- */
const articleInput = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(50),
  relatedWorkId: z.string(),
  status: z.enum(["draft", "published"]),
});

export async function createArticle(
  input: z.infer<typeof articleInput>,
): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const parsed = articleInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "入力内容を確認してください" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  const d = parsed.data;

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      user_id: user.id,
      title: d.title,
      body: d.body,
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

/* ---------- フォロー ---------- */
export async function toggleFollow(followeeId: string): Promise<ActionResult> {
  if (!supabaseEnabled) return { ok: true, mock: true };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: NEEDS_LOGIN };
  if (user.id === followeeId) return { ok: false, error: "自分はフォローできません" };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("followee_id", followeeId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
  } else {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id: followeeId });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/home");
  return { ok: true };
}

async function displayNameOf(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  return data?.display_name ?? "名無しの批評家";
}
