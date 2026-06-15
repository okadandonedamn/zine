"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, SlidersHorizontal, Zap } from "lucide-react";
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
  mode: z.enum(["rough", "expert"]),
  workId: z.string().min(1, "作品を選んでください"),
  status: z.enum(["want", "doing", "done", "stacked", "paused", "rewatch"]),
  date: z.string().min(1, "日付を入力してください"),
  durationMinutes: z.string(),
  pages: z.string(),
  episodes: z.string(),
  tracks: z.string(),
  place: z.string(),
  memo: z.string().max(300, "ひとことメモは300文字まで"),
  comment: z.string().max(2000, "コメントは2000文字まで"),
  imageUrls: z.string().max(1200, "画像URLは合計1200文字まで"),
  focusScore: z.string(),
  satisfactionScore: z.string(),
  revisitScore: z.string(),
  customMetricLabel: z.string().max(20),
  customMetricValue: z.string(),
  visibility: z.enum(["public", "private"]),
});

type RecordForm = z.infer<typeof recordSchema>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nullableNumber(value: string) {
  return value === "" ? null : Number(value);
}

function parseImageUrls(value: string) {
  return value
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function RecordEditor({ works }: { works: Work[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);

  const form = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      mode: "rough",
      workId: "",
      status: "done",
      date: today(),
      durationMinutes: "",
      pages: "",
      episodes: "",
      tracks: "",
      place: "",
      memo: "",
      comment: "",
      imageUrls: "",
      focusScore: "",
      satisfactionScore: "",
      revisitScore: "",
      customMetricLabel: "",
      customMetricValue: "",
      visibility: "private",
    },
  });

  const mode = form.watch("mode");
  const work = works.find((w) => w.id === form.watch("workId"));
  const status = form.watch("status");

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">記録しました</p>
        <p className="text-sm text-muted">
          {form.getValues("visibility") === "public"
            ? "公開記録としてタイムラインにも流れます。"
            : "非公開記録として保存しました。"}
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <Link href="/records" className="text-accent hover:underline">
            記録タイムラインへ
          </Link>
          <Link href="/records/stats" className="text-accent hover:underline">
            統計を見る
          </Link>
        </div>
      </Card>
    );
  }

  async function onSubmit(values: RecordForm) {
    setServerError(null);
    const customMetrics =
      values.customMetricLabel && values.customMetricValue !== ""
        ? [{ label: values.customMetricLabel, value: Number(values.customMetricValue) }]
        : [];
    const result = await createRecordSession({
      mode: values.mode,
      workId: values.workId,
      status: values.status,
      date: values.date,
      durationMinutes: nullableNumber(values.durationMinutes),
      pages: nullableNumber(values.pages),
      episodes: nullableNumber(values.episodes),
      tracks: nullableNumber(values.tracks),
      place: values.mode === "expert" ? values.place : "",
      memo: values.memo,
      comment: values.mode === "expert" ? values.comment : "",
      imageUrls: values.mode === "expert" ? parseImageUrls(values.imageUrls) : [],
      emotionTags: values.mode === "expert" ? emotions : [],
      focusScore: values.mode === "expert" ? nullableNumber(values.focusScore) : null,
      satisfactionScore:
        values.mode === "expert" ? nullableNumber(values.satisfactionScore) : null,
      revisitScore: values.mode === "expert" ? nullableNumber(values.revisitScore) : null,
      customMetrics: values.mode === "expert" ? customMetrics : [],
      visibility: values.visibility,
    });
    if (result.ok) setSubmitted(true);
    else setServerError(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-md border border-line p-1">
        {[
          { key: "rough", label: "ラフ記録", icon: Zap },
          { key: "expert", label: "エキスパートモード", icon: SlidersHorizontal },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => form.setValue("mode", key as "rough" | "expert")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
              mode === key
                ? "bg-accent text-accent-fg"
                : "text-muted hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">作品</label>
        <select
          {...form.register("workId")}
          className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="">作品を選ぶ...</option>
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title} ({CATEGORY_LABELS[w.category]})
            </option>
          ))}
        </select>
        {form.formState.errors.workId && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.workId.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">ステータス</label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => form.setValue("status", item)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors",
                status === item
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:text-foreground",
              )}
            >
              {statusLabel(work?.category ?? "film", item)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-muted">日付</label>
          <Input type="date" {...form.register("date")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">公開範囲</label>
          <select
            {...form.register("visibility")}
            className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
          >
            <option value="private">非公開</option>
            <option value="public">公開</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-muted">ひとことメモ</label>
        <Textarea rows={mode === "rough" ? 3 : 2} {...form.register("memo")} />
        {form.formState.errors.memo && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.memo.message}</p>
        )}
      </div>

      {mode === "expert" && (
        <div className="space-y-5 border-t border-line pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs text-muted">鑑賞時間(分)</label>
              <Input type="number" min={0} placeholder="98" {...form.register("durationMinutes")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">ページ数</label>
              <Input type="number" min={0} placeholder="86" {...form.register("pages")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">話数</label>
              <Input type="number" min={0} placeholder="1" {...form.register("episodes")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">曲数</label>
              <Input type="number" min={0} placeholder="12" {...form.register("tracks")} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted">場所</label>
            <Input placeholder="自宅、映画館、美術館..." {...form.register("place")} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted">感情タグ</label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setEmotions((prev) =>
                      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                    )
                  }
                  className={cn(
                    "cursor-pointer rounded-sm border px-2 py-1 text-xs transition-colors",
                    emotions.includes(tag)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line text-muted hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-xs text-muted">
              <ImagePlus size={13} />
              画像URL
            </label>
            <Textarea
              rows={2}
              placeholder="1行に1つ、またはカンマ区切り"
              {...form.register("imageUrls")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted">コメント / ノート</label>
            <Textarea rows={6} {...form.register("comment")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs text-muted">集中度</label>
              <Input type="number" min={0} max={10} {...form.register("focusScore")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">満足度</label>
              <Input type="number" min={0} max={10} {...form.register("satisfactionScore")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">再訪したさ</label>
              <Input type="number" min={0} max={10} {...form.register("revisitScore")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1.5 block text-xs text-muted">カスタム数値名</label>
              <Input placeholder="余韻" {...form.register("customMetricLabel")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">値</label>
              <Input type="number" min={0} max={100} {...form.register("customMetricValue")} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-line pt-4">
        <Button type="submit" className="ml-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "送信中..." : "記録する"}
        </Button>
      </div>
      {serverError && <p className="text-xs text-accent">{serverError}</p>}
    </form>
  );
}
