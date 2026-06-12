"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadarRatingChart } from "./radar-rating-chart";
import { RatingStars } from "./rating-stars";
import { DEFAULT_TEMPLATES, defaultTemplateFor, USER_TEMPLATES } from "@/lib/review-templates";
import { createReview, saveAxisTemplate } from "@/lib/actions";
import { CATEGORY_LABELS, type Work, type WorkCategory } from "@/lib/types";

const reviewSchema = z.object({
  workId: z.string().min(1, "作品を選んでください"),
  rating: z.coerce.number().min(0.5, "星をつけてください").max(5),
  body: z.string().min(10, "レビュー本文は10文字以上で書いてください"),
  spoiler: z.boolean(),
  visibility: z.enum(["public", "private"]),
  axes: z
    .array(
      z.object({
        axis: z.string().min(1, "軸の名前を入力してください").max(8, "軸名は8文字まで"),
        score: z.coerce.number().min(1).max(10),
      }),
    )
    .length(5),
});

type ReviewForm = z.infer<typeof reviewSchema>;

/**
 * レビューエディタ。
 * 「批評の型を自分で作る」: テンプレートから始めて、軸名を自由に書き換え、
 * 右側で五角形がリアルタイムに描かれる。
 */
export function ReviewEditor({
  works,
  initialWorkId,
}: {
  works: Work[];
  initialWorkId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [templateSaved, setTemplateSaved] = useState(false);

  const initialWork = works.find((w) => w.id === initialWorkId);
  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      workId: initialWorkId ?? "",
      rating: 0,
      body: "",
      spoiler: false,
      visibility: "public",
      axes: defaultTemplateFor(initialWork?.category ?? "film").axes.map((axis) => ({
        axis,
        score: 5,
      })),
    },
  });
  const { fields } = useFieldArray({ control: form.control, name: "axes" });

  const axes = form.watch("axes");
  const rating = form.watch("rating");
  const workId = form.watch("workId");
  const selectedWork = works.find((w) => w.id === workId);

  // 作品を選んだら、そのカテゴリのデフォルトテンプレートを適用
  function applyCategoryTemplate(category: WorkCategory) {
    const tpl = defaultTemplateFor(category);
    tpl.axes.forEach((axis, i) => form.setValue(`axes.${i}.axis`, axis));
  }

  function applyTemplate(templateId: string) {
    const tpl = [...DEFAULT_TEMPLATES, ...USER_TEMPLATES].find((t) => t.id === templateId);
    if (!tpl) return;
    tpl.axes.forEach((axis, i) => form.setValue(`axes.${i}.axis`, axis));
  }

  if (submitted) {
    return (
      <Card className="space-y-4 p-8 text-center">
        <p className="font-display text-xl font-semibold">レビューを投稿しました</p>
        <p className="text-sm text-muted">あなたの批評がタイムラインに流れました。</p>
        <div className="mx-auto max-w-xs">
          <RadarRatingChart axes={axes} size="md" />
        </div>
        <Link href="/home" className="inline-block text-sm text-accent hover:underline">
          タイムラインに戻る →
        </Link>
      </Card>
    );
  }

  async function onSubmit(values: ReviewForm) {
    setServerError(null);
    const result = await createReview({
      workId: values.workId,
      rating: values.rating,
      body: values.body,
      tags: "",
      spoiler: values.spoiler,
      visibility: values.visibility,
      axes: values.axes,
    });
    if (result.ok) setSubmitted(true);
    else setServerError(result.error);
  }

  async function onSaveTemplate() {
    const name = window.prompt("テンプレート名を入力してください", "マイ批評軸");
    if (!name) return;
    const result = await saveAxisTemplate({ name, axes: axes.map((a) => a.axis) });
    if (result.ok) setTemplateSaved(true);
    else setServerError(result.error);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-5">
        {/* 作品選択 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">作品</label>
          <select
            {...form.register("workId", {
              onChange: (e) => {
                const w = works.find((x) => x.id === e.target.value);
                if (w) applyCategoryTemplate(w.category);
              },
            })}
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

        {/* 星評価 — 真実は本棚に住む(v1.1 判断4) */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">総合評価</label>
          <p className="mb-2 text-xs text-subtle">
            星はあなたの本棚(鑑賞記録)に付きます。レビューと本棚で星が食い違うことはありません。
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={rating || 0.5}
              onChange={(e) => form.setValue("rating", Number(e.target.value))}
              className="w-48 accent-(--accent)"
            />
            <RatingStars rating={rating || 0} size={18} />
          </div>
          {form.formState.errors.rating && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.rating.message}</p>
          )}
        </div>

        {/* 本文 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">本文</label>
          <Textarea
            rows={10}
            placeholder="星では言い切れないことを、ここに。"
            {...form.register("body")}
          />
          {form.formState.errors.body && (
            <p className="mt-1 text-xs text-accent">{form.formState.errors.body.message}</p>
          )}
        </div>

        {/* オプション */}
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register("spoiler")} className="accent-(--accent)" />
            ネタバレを含む
          </label>
          <label className="flex items-center gap-2">
            公開範囲
            <select
              {...form.register("visibility")}
              className="h-8 rounded-md border border-line bg-background px-2 text-sm"
            >
              <option value="public">公開</option>
              <option value="private">非公開</option>
            </select>
          </label>
        </div>

        {serverError && <p className="text-xs text-accent">{serverError}</p>}
        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "送信中…" : "レビューを投稿"}
        </Button>
      </div>

      {/* 右カラム: 批評軸エディタ + 五角形プレビュー */}
      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            あなたの批評軸
          </h2>
          <p className="mt-1 text-xs text-subtle">
            軸の名前は自由に書き換えられます。それがあなたの批評の型になります。
          </p>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            defaultValue=""
            className="mt-3 h-8 w-full rounded-md border border-line bg-background px-2 text-xs"
          >
            <option value="" disabled>
              テンプレートから選ぶ…
            </option>
            <optgroup label="カテゴリ別デフォルト">
              {DEFAULT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="マイテンプレート">
              {USER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          </select>

          <div className="mt-4 space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...form.register(`axes.${i}.axis`)}
                  className="h-8 w-24 text-xs"
                  placeholder={`軸${i + 1}`}
                />
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={axes[i]?.score ?? 5}
                  onChange={(e) => form.setValue(`axes.${i}.score`, Number(e.target.value))}
                  className="flex-1 accent-(--accent)"
                />
                <span className="w-6 text-right font-display text-sm">{axes[i]?.score}</span>
              </div>
            ))}
          </div>
          {form.formState.errors.axes && (
            <p className="mt-2 text-xs text-accent">軸の名前をすべて入力してください</p>
          )}

          <div className="mt-2 border-t border-line pt-2">
            <RadarRatingChart axes={axes} size="lg" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onSaveTemplate}
            disabled={templateSaved}
          >
            {templateSaved ? "保存しました ✓" : "この軸をマイテンプレートとして保存"}
          </Button>
        </Card>

        {selectedWork && (
          <Card className="p-4 text-sm">
            <p className="font-display font-semibold">{selectedWork.title}</p>
            <p className="mt-1 text-xs text-subtle">
              {CATEGORY_LABELS[selectedWork.category]} ・ {selectedWork.creator}
            </p>
          </Card>
        )}
      </div>
    </form>
  );
}
