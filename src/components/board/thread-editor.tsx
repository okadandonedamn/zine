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
import type { Board, Work } from "@/lib/types";

const threadSchema = z.object({
  boardId: z.string().min(1, "板を選んでください"),
  title: z.string().min(5, "タイトルは5文字以上").max(60, "60文字まで"),
  body: z.string().min(10, "最初のレス(>>1)は10文字以上で"),
  workId: z.string(),
  anonymous: z.boolean(),
});

type ThreadForm = z.infer<typeof threadSchema>;

export function ThreadEditor({ boards, works }: { boards: Board[]; works: Work[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ThreadForm>({
    resolver: zodResolver(threadSchema),
    defaultValues: { boardId: "", title: "", body: "", workId: "", anonymous: true },
  });

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">スレッドを立てました</p>
        <p className="text-sm text-muted">議論の場が開かれ、タイムラインに流れました。</p>
        <Link href="/boards" className="inline-block text-sm text-accent hover:underline">
          掲示板へ →
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
        <label className="mb-1.5 block text-sm font-medium">板</label>
        <select
          {...form.register("boardId")}
          className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="">板を選ぶ…</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {form.formState.errors.boardId && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.boardId.message}</p>
        )}
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
      <div>
        <label className="mb-1.5 block text-xs text-muted">関連作品(任意)</label>
        <select
          {...form.register("workId")}
          className="h-9 w-full rounded-md border border-line bg-background px-3 text-sm"
        >
          <option value="">なし</option>
          {works.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register("anonymous")} className="accent-(--accent)" />
        匿名スレにする(全員「名無しの批評家」として書き込む)
      </label>
      {serverError && <p className="text-xs text-accent">{serverError}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "送信中…" : "スレッドを立てる"}
      </Button>
    </form>
  );
}
