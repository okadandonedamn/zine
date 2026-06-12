"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createRecordSession } from "@/lib/actions";
import { ALL_STATUSES, EMOTION_TAGS, statusLabel } from "@/lib/record-status";
import { CATEGORY_LABELS, type Work } from "@/lib/types";
import { cn } from "@/lib/utils";

const recordSchema = z.object({
  workId: z.string().min(1, "作品を選んでください"),
  status: z.enum(["want", "doing", "done", "stacked", "paused", "rewatch"]),
  date: z.string().min(1, "日付を入力してください"),
  durationMinutes: z.string(),
  pages: z.string(),
  episodes: z.string(),
  tracks: z.string(),
  place: z.string(),
  memo: z.string().max(300, "メモは300文字まで"),
  visibility: z.enum(["public", "private"]),
});

type RecordForm = z.infer<typeof recordSchema>;

export function RecordEditor({ works }: { works: Work[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);

  const form = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      workId: "",
      status: "done",
      date: "2026-06-11",
      durationMinutes: "",
      pages: "",
      episodes: "",
      tracks: "",
      place: "",
      memo: "",
      // 時間ログは既定非公開(v1.1 判断11)。日記は守られ、批評は開かれる
      visibility: "private",
    },
  });

  const work = works.find((w) => w.id === form.watch("workId"));
  const status = form.watch("status");

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">記録しました</p>
        <p className="text-sm text-muted">
          {form.getValues("visibility") === "public"
            ? "公開記録なので、タイムラインにも流れます。"
            : "非公開記録は、あなただけが見られます。"}
        </p>
        <Link href="/records" className="inline-block text-sm text-accent hover:underline">
          記録一覧へ →
        </Link>
      </Card>
    );
  }

  async function onSubmit(values: RecordForm) {
    setServerError(null);
    const num = (s: string) => (s === "" ? null : Number(s));
    const result = await createRecordSession({
      workId: values.workId,
      status: values.status,
      date: values.date,
      durationMinutes: num(values.durationMinutes),
      pages: num(values.pages),
      episodes: num(values.episodes),
      tracks: num(values.tracks),
      place: values.place,
      memo: values.memo,
      emotionTags: emotions,
      visibility: values.visibility,
    });
    if (result.ok) setSubmitted(true);
    else setServerError(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">作品</label>
        <select
          {...form.register("workId")}
          className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="">作品を選ぶ…</option>
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}({CATEGORY_LABELS[w.category]})
            </option>
          ))}
        </select>
        {form.formState.errors.workId && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.workId.message}</p>
        )}
      </div>

      {/* ステータス: 作品カテゴリに応じて語彙が変わる */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">ステータス</label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => form.setValue("status", s)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                status === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:text-foreground",
              )}
            >
              {statusLabel(work?.category ?? "film", s)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs text-muted">日付</label>
          <Input type="date" {...form.register("date")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">鑑賞時間(分)</label>
          <Input type="number" min={0} placeholder="98" {...form.register("durationMinutes")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">ページ数</label>
          <Input type="number" min={0} placeholder="86" {...form.register("pages")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">話数 / 曲数</label>
          <div className="flex gap-2">
            <Input type="number" min={0} placeholder="話" {...form.register("episodes")} />
            <Input type="number" min={0} placeholder="曲" {...form.register("tracks")} />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-muted">場所</label>
        <Input placeholder="新宿、自宅、美術館…" {...form.register("place")} />
      </div>

      {/* 感情タグ */}
      <div>
        <label className="mb-1.5 block text-xs text-muted">感情タグ</label>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setEmotions((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                )
              }
              className={cn(
                "cursor-pointer rounded-sm border px-2 py-1 text-xs transition-colors",
                emotions.includes(t)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-muted">メモ</label>
        <Textarea rows={3} placeholder="ひとことでも。未来の自分への手紙です。" {...form.register("memo")} />
        {form.formState.errors.memo && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.memo.message}</p>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-4">
        <select
          {...form.register("visibility")}
          className="h-9 rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="private">非公開(自分だけの日記)</option>
          <option value="public">公開(タイムラインに流れる)</option>
        </select>
        <Button type="submit" className="ml-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "送信中…" : "記録する"}
        </Button>
      </div>
      {serverError && <p className="text-xs text-accent">{serverError}</p>}
    </form>
  );
}
