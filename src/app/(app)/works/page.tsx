import Link from "next/link";
import { WorkCard } from "@/components/work/work-card";
import { EmptyState } from "@/components/common/empty-state";
import { getWorks } from "@/lib/data";
import { CATEGORY_LABELS, type WorkCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "作品" };

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const all = await getWorks();
  const works = category ? all.filter((w) => w.category === category) : all;
  const categories = Object.entries(CATEGORY_LABELS) as [WorkCategory, string][];

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">作品</h1>
      <p className="mt-1 text-sm text-muted">レビューと記録が蓄積される、ZINEの書架。</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/works"
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            !category ? "border-accent text-accent" : "border-line text-muted hover:text-foreground",
          )}
        >
          すべて
        </Link>
        {categories.map(([key, label]) => (
          <Link
            key={key}
            href={`/works?category=${key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              category === key
                ? "border-accent text-accent"
                : "border-line text-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {works.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="このカテゴリの作品はまだありません"
            description="最初の作品を登録して、書架を育ててください。"
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {works.map((w) => (
            <WorkCard key={w.id} work={w} />
          ))}
        </div>
      )}
    </div>
  );
}
