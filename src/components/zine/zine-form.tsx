"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createZine } from "@/lib/actions";
import type { Article, Review, Work, ZineItemType } from "@/lib/types";

type Selectable = { type: ZineItemType; sourceId: string };

/**
 * 冊子の作成フォーム(/zines/new)。
 * 素材(自分の記事・レビュー)にチェックを入れた順がページ順になる。
 */
export function ZineForm({
  articles,
  reviews,
}: {
  articles: Article[];
  reviews: { review: Review; work?: Work }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selected, setSelected] = useState<Selectable[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderOf = (item: Selectable) =>
    selected.findIndex((s) => s.type === item.type && s.sourceId === item.sourceId);

  const toggle = (item: Selectable) => {
    setSelected((prev) =>
      orderOf(item) >= 0
        ? prev.filter((s) => !(s.type === item.type && s.sourceId === item.sourceId))
        : [...prev, item],
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await createZine({ title, description, isPrivate, items: selected });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(result.id ? `/zines/${result.id}` : "/zines");
    router.refresh();
  }

  const pickRow = (item: Selectable, heading: string, sub: string) => {
    const order = orderOf(item);
    return (
      <label
        key={`${item.type}-${item.sourceId}`}
        className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 transition-colors hover:bg-surface-2"
      >
        <input
          type="checkbox"
          checked={order >= 0}
          onChange={() => toggle(item)}
          className="mt-1 accent-(--accent)"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{heading}</span>
          <span className="mt-0.5 block truncate text-xs text-subtle">{sub}</span>
        </span>
        {order >= 0 && (
          <span className="ml-auto shrink-0 font-display text-sm font-semibold text-accent">
            {order + 1}
          </span>
        )}
      </label>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="zine-title" className="text-sm font-semibold">
          冊子の題
        </label>
        <Input
          id="zine-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="暗がりの観客 — 二〇二六年上半期"
          maxLength={60}
          required
          className="mt-2"
        />
      </div>
      <div>
        <label htmlFor="zine-desc" className="text-sm font-semibold">
          まえがき(任意)
        </label>
        <Textarea
          id="zine-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="この一冊の読み方、編んだ理由など。"
          maxLength={500}
          rows={3}
          className="mt-2"
        />
      </div>

      <div>
        <p className="text-sm font-semibold">
          素材を選ぶ
          <span className="ml-2 text-xs font-normal text-subtle">
            選んだ順がページ順になります(現在 {selected.length} 篇)
          </span>
        </p>
        {articles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs tracking-widest text-subtle">ARTICLES</p>
            {articles.map((a) =>
              pickRow(
                { type: "article", sourceId: a.id },
                a.title,
                `読了${a.readMinutes}分`,
              ),
            )}
          </div>
        )}
        {reviews.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs tracking-widest text-subtle">REVIEWS</p>
            {reviews.map(({ review, work }) =>
              pickRow(
                { type: "review", sourceId: review.id },
                work ? `『${work.title}』評` : "レビュー",
                review.body.slice(0, 40),
              ),
            )}
          </div>
        )}
        {articles.length === 0 && reviews.length === 0 && (
          <p className="mt-3 rounded-md border border-dashed border-line p-4 text-sm text-subtle">
            まだ編める素材がありません。記事かレビューを書くと、ここに並びます。
          </p>
        )}
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
        <Button
          type="submit"
          disabled={pending || title.trim().length === 0 || selected.length === 0}
        >
          {pending ? "編んでいます…" : "一冊に編む"}
        </Button>
        <p className="text-xs text-subtle">編んだあとも素材の記事・レビューはそのまま残ります。</p>
      </div>
    </form>
  );
}
