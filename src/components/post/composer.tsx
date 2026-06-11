"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/user-avatar";
import { createPost } from "@/lib/actions";
import type { User } from "@/lib/types";

const postSchema = z.object({
  body: z.string().min(1, "本文を入力してください").max(500, "500文字まで"),
  tags: z.string(),
  visibility: z.enum(["public", "private"]),
});

type PostForm = z.infer<typeof postSchema>;

export function Composer({ user }: { user: User | null }) {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { body: "", tags: "", visibility: "public" },
  });
  const body = form.watch("body");

  if (!user) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-lg font-semibold">ログインが必要です</p>
        <p className="text-sm text-muted">投稿するにはサインインしてください。</p>
        <Link href="/login" className="inline-block text-sm text-accent hover:underline">
          ログインへ →
        </Link>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">投稿しました</p>
        <p className="text-sm text-muted">あなたの声がタイムラインに流れました。</p>
        <Link href="/home" className="inline-block text-sm text-accent hover:underline">
          タイムラインに戻る →
        </Link>
      </Card>
    );
  }

  async function onSubmit(values: PostForm) {
    setServerError(null);
    const result = await createPost({
      body: values.body,
      tags: values.tags,
      visibility: values.visibility,
    });
    if (result.ok) setSubmitted(true);
    else setServerError(result.error);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex gap-3">
        <UserAvatar user={user} link={false} />
        <div className="flex-1 space-y-3">
          <textarea
            {...form.register("body")}
            rows={5}
            autoFocus
            placeholder="いま、何を観ましたか?"
            className="w-full resize-y bg-transparent text-lg leading-8 outline-none placeholder:text-subtle"
          />
          {form.formState.errors.body && (
            <p className="text-xs text-accent">{form.formState.errors.body.message}</p>
          )}
          <Input {...form.register("tags")} placeholder="タグ(カンマ区切り)" className="max-w-sm" />
          {serverError && <p className="text-xs text-accent">{serverError}</p>}
          <div className="flex items-center gap-3 border-t border-line pt-3">
            <Button type="button" variant="ghost" size="icon" aria-label="画像を追加">
              <ImagePlus size={18} />
            </Button>
            <select
              {...form.register("visibility")}
              className="h-8 rounded-md border border-line bg-background px-2 text-xs"
            >
              <option value="public">公開</option>
              <option value="private">非公開</option>
            </select>
            <span className="ml-auto text-xs text-subtle">{body.length}/500</span>
            <Button type="submit" disabled={body.length === 0 || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "送信中…" : "投稿"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
