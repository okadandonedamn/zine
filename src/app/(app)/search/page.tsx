import Link from "next/link";
import { Search } from "lucide-react";
import { Timeline } from "@/components/timeline/timeline";
import { WorkCard } from "@/components/work/work-card";
import { EmptyState } from "@/components/common/empty-state";
import { getTimeline, getTrendingTags, getWorks } from "@/lib/data";
import type { FeedItem, Work } from "@/lib/types";

export const metadata = { title: "検索" };

/** 検索v1: 作品はタイトル・作者、フィードは本文を単純一致で探す */
function matchWork(w: Work, q: string) {
  return (
    w.title.toLowerCase().includes(q) ||
    w.creator.toLowerCase().includes(q) ||
    w.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function matchFeedItem(f: FeedItem, q: string) {
  const text =
    f.type === "post" || f.type === "quote"
      ? f.post.body
      : f.type === "review"
        ? f.review.body + f.work.title
        : f.type === "article"
          ? f.article.title + f.article.excerpt
          : f.type === "thread"
            ? f.thread.title + f.thread.body
            : f.work.title + (f.record.memo ?? "");
  return text.toLowerCase().includes(q);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const trends = await getTrendingTags();

  let result: { works: Work[]; items: FeedItem[] } | null = null;
  if (q) {
    const lower = q.toLowerCase();
    const [works, items] = await Promise.all([getWorks(), getTimeline("latest")]);
    result = {
      works: works.filter((w) => matchWork(w, lower)),
      items: items.filter((f) => matchFeedItem(f, lower)),
    };
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">検索</h1>
      <form action="/search" className="relative mt-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="作品、投稿、タグ、人を探す"
          className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-sm outline-none focus:border-accent"
        />
      </form>

      {!result ? (
        <div className="mt-8">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            いま語られている
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {trends.map((t) => (
              <Link
                key={t.tag}
                href={`/search?q=${encodeURIComponent(t.tag)}`}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-accent hover:text-accent"
              >
                #{t.tag}
              </Link>
            ))}
          </div>
        </div>
      ) : result.works.length === 0 && result.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={`「${q}」は見つかりませんでした`}
            description="表記ゆれや、別の言葉でも試してみてください。"
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {result.works.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
                作品 {result.works.length}件
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {result.works.map((w) => (
                  <WorkCard key={w.id} work={w} />
                ))}
              </div>
            </section>
          )}
          {result.items.length > 0 && (
            <section>
              <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
                投稿 {result.items.length}件
              </h2>
              <div className="mt-2 rounded-lg border border-line">
                <Timeline items={result.items} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
