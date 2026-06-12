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
import { createThread } from "@/lib/actions";
import { CATEGORY_LABELS, type Work } from "@/lib/types";

const threadSchema = z.object({
  workId: z.string().min(1, "作品を選んでください"),
  title: z.string().min(5, "タイトルは5文字以上").max(60, "60文字まで"),
  body: z.string().min(10, "最初のレス(>>1)は10文字以上で"),
});

type ThreadForm = z.infer<typeof threadSchema>;

/**
 * スレッド作成。語り場は必ず作品に従属する(独立した板は無い)。
 * 投稿はハンドル(表示名)で行われる。
 */
export function ThreadEditor({
  works,
  initialWorkId,
}: {
  works: Work[];
  initialWorkId?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ThreadForm>({
    resolver: zodResolver(threadSchema),
    defaultValues: { workId: initialWorkId ?? "", title: "", body: "" },
  });
  const work = works.find((w) => w.id === form.watch("workId"));

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">スレッドを立てました</p>
        <p className="text-sm text-muted">議論の場が開かれ、タイムラインに流れました。</p>
        <Link
          href={work ? `/works/${work.id}` : "/home"}
          className="inline-block text-sm text-accent hover:underline"
        >
          {work ? `『${work.title}』の語り場へ →` : "タイムラインへ →"}
        </Link>
      </Card>
    );
  }

  async function onSubmit(values: ThreadForm) {
    setServerError(null);
    const result = await createThread(values);
    if (result.ok) setSubmitted(true);
    else setServerError(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">作品(語り場の帰属先)</label>
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
        <p className="mt-1 text-xs text-subtle">
          スレッドは作品ページの「語り場」に帰属します。
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">スレッドタイトル</label>
        <Input {...form.register("title")} placeholder="【ネタバレ可】〜をどう解釈するか" />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.title.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">最初のレス(&gt;&gt;1)</label>
        <Textarea
          rows={5}
          {...form.register("body")}
          placeholder="議論の前提・ルール・自分の考えを書いておくと、スレが育ちやすくなります。"
        />
        {form.formState.errors.body && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.body.message}</p>
        )}
      </div>
      {serverError && <p className="text-xs text-accent">{serverError}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "送信中…" : "スレッドを立てる"}
      </Button>
    </form>
  );
}
