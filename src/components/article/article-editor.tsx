"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createArticle } from "@/lib/actions";
import type { Work } from "@/lib/types";
import { cn } from "@/lib/utils";

const articleSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(80, "80文字まで"),
  body: z.string().min(50, "本文は50文字以上で書いてください"),
  tags: z.string(),
  relatedWorkId: z.string(),
  cover: z.string(),
});

type ArticleForm = z.infer<typeof articleSchema>;

const COVERS = [
  ["#7a1f1f", "#1a0808"],
  ["#1f3a5e", "#0a1220"],
  ["#1f4a2e", "#0e1f14"],
  ["#6e4a1f", "#1a1208"],
  ["#5a5a8d", "#14142a"],
  ["#262626", "#0a0a0a"],
];

/**
 * 記事エディタ。白紙の紙・深夜の机。
 * 装飾を最小限にして、書くことだけに集中できるUI。
 */
export function ArticleEditor({ works }: { works: Work[] }) {
  const [result, setResult] = useState<"draft" | "published" | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: { title: "", body: "", tags: "", relatedWorkId: "", cover: "0" },
  });
  const cover = COVERS[Number(form.watch("cover"))] ?? COVERS[0];
  const body = form.watch("body");
  const readMinutes = Math.max(1, Math.round(body.length / 600));

  if (result) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <p className="font-display text-xl font-semibold">
          {result === "draft" ? "下書きを保存しました" : "記事を公開しました"}
        </p>
        <p className="text-sm text-muted">
          {result === "draft"
            ? "下書きはあなただけが見られます。"
            : "あなたの思想がタイムラインに流れました。"}
        </p>
        <Link href="/home" className="inline-block text-sm text-accent hover:underline">
          タイムラインに戻る →
        </Link>
      </Card>
    );
  }

  async function submit(status: "draft" | "published") {
    setServerError(null);
    const values = form.getValues();
    const actionResult = await createArticle({
      title: values.title,
      body: values.body,
      relatedWorkId: values.relatedWorkId,
      status,
    });
    if (actionResult.ok) setResult(status);
    else setServerError(actionResult.error);
  }

  return (
    <form onSubmit={form.handleSubmit(() => submit("published"))}>
      {/* カバー選択 */}
      <div
        className="flex h-32 items-end gap-2 rounded-lg p-3"
        style={{ background: `linear-gradient(160deg, ${cover[0]}, ${cover[1]})` }}
      >
        {COVERS.map((c, i) => (
          <button
            key={i}
            type="button"
            aria-label={`カバー${i + 1}`}
            onClick={() => form.setValue("cover", String(i))}
            className={cn(
              "h-7 w-7 cursor-pointer rounded-sm border",
              Number(form.watch("cover")) === i ? "border-white" : "border-white/30",
            )}
            style={{ background: `linear-gradient(160deg, ${c[0]}, ${c[1]})` }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-2xl py-8">
        <input
          {...form.register("title")}
          placeholder="タイトル"
          className="w-full bg-transparent font-display text-2xl font-bold outline-none placeholder:text-subtle sm:text-3xl"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-xs text-accent">{form.formState.errors.title.message}</p>
        )}

        <textarea
          {...form.register("body")}
          rows={18}
          placeholder={"本文を書く。\n\n「## 」で始まる行は見出しになります。"}
          className="prose-zine mt-6 w-full resize-y bg-transparent outline-none placeholder:text-subtle"
        />
        {form.formState.errors.body && (
          <p className="text-xs text-accent">{form.formState.errors.body.message}</p>
        )}

        <div className="mt-6 space-y-4 border-t border-line pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-muted">タグ(カンマ区切り)</label>
              <Input {...form.register("tags")} placeholder="映画批評, 省略" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">関連作品</label>
              <select
                {...form.register("relatedWorkId")}
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
          </div>
          {serverError && <p className="text-xs text-accent">{serverError}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "送信中…" : "公開する"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.handleSubmit(() => submit("draft"))()}
            >
              下書き保存
            </Button>
            <span className="ml-auto text-xs text-subtle">読了目安 {readMinutes}分</span>
          </div>
        </div>
      </div>
    </form>
  );
}
