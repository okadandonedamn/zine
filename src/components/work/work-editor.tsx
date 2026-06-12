"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWork } from "@/lib/actions";
import { ACTIVE_CATEGORIES, CATEGORY_LABELS, type Work, type WorkCategory } from "@/lib/types";

const workSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100, "100文字まで"),
  category: z.string().min(1, "カテゴリを選んでください"),
  creator: z.string().max(100, "100文字まで"),
  year: z.string(),
  description: z.string().max(1000, "1000文字まで"),
});

type WorkForm = z.infer<typeof workSchema>;

export function WorkEditor({ existingWorks }: { existingWorks: Work[] }) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<WorkForm>({
    resolver: zodResolver(workSchema),
    defaultValues: { title: "", category: "", creator: "", year: "", description: "" },
  });

  async function onSubmit(values: WorkForm) {
    setServerError(null);
    const result = await createWork({
      title: values.title,
      category: values.category as WorkCategory,
      creator: values.creator,
      year: values.year === "" ? null : Number(values.year),
      description: values.description,
    });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    if (result.id) {
      router.push(`/works/${result.id}`);
      router.refresh();
    } else {
      setSubmitted(true); // モックモード
    }
  }

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">作品を登録しました</p>
        <p className="text-sm text-muted">
          (モックモードのため保存されません。Supabase接続後は作品ページに移動します)
        </p>
        <Link href="/works" className="inline-block text-sm text-accent hover:underline">
          作品一覧へ →
        </Link>
      </Card>
    );
  }

  // 「先に検索」: 入力中のタイトルに似た既存作品を出し、重複登録を防ぐ
  const title = form.watch("title").trim();
  const possibleDuplicates =
    title.length >= 2
      ? existingWorks
          .filter(
            (w) =>
              w.title.toLowerCase().includes(title.toLowerCase()) ||
              title.toLowerCase().includes(w.title.toLowerCase()),
          )
          .slice(0, 3)
      : [];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">タイトル</label>
        <Input {...form.register("title")} placeholder="花様年華" />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.title.message}</p>
        )}
        {possibleDuplicates.length > 0 && (
          <div className="mt-2 rounded-md border border-accent/40 bg-accent/5 p-3">
            <p className="text-xs font-medium text-accent">
              もう書架にあるかもしれません。先に確認してください:
            </p>
            <ul className="mt-1.5 space-y-1">
              {possibleDuplicates.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/works/${w.id}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {w.title}
                    <span className="ml-2 text-xs text-subtle">
                      {CATEGORY_LABELS[w.category]} / {w.creator} / {w.year}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">カテゴリ</label>
          <select
            {...form.register("category")}
            className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
          >
            <option value="">選ぶ…</option>
            {ACTIVE_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
          {form.formState.errors.category && (
            <p className="mt-1 text-xs text-accent">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">発表年</label>
          <Input type="number" {...form.register("year")} placeholder="2000" />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          作者 / 監督 / アーティスト / ブランド
        </label>
        <Input {...form.register("creator")} placeholder="ウォン・カーウァイ" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">説明</label>
        <Textarea
          rows={4}
          {...form.register("description")}
          placeholder="どんな作品か。あらすじ、背景、位置づけなど。"
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-xs text-accent">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {serverError && <p className="text-xs text-accent">{serverError}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "送信中…" : "作品を登録する"}
      </Button>
    </form>
  );
}
