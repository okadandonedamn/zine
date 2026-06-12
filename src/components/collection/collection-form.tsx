"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCollection } from "@/lib/actions";

/** コレクション作成フォーム(/collections/new) */
export function CollectionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createCollection({ title, description, isPrivate });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(result.id ? `/collections/${result.id}` : "/collections");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="col-title" className="text-sm font-semibold">
          タイトル
        </label>
        <Input
          id="col-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="雨の日に観る映画"
          maxLength={60}
          required
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="col-desc" className="text-sm font-semibold">
          説明(任意)
        </label>
        <Textarea
          id="col-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="このリストの読み方、並び順の意味など。"
          maxLength={300}
          rows={3}
          className="mt-2"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="accent-(--accent)"
        />
        非公開にする(自分だけが見られます)
      </label>
      {error && <p className="text-sm text-accent">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || title.trim().length === 0}>
          {pending ? "作成中…" : "コレクションを作る"}
        </Button>
        <p className="text-xs text-subtle">作品は各作品ページから加えられます。</p>
      </div>
    </form>
  );
}
