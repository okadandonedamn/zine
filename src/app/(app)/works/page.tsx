import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkCard } from "@/components/work/work-card";
import { EmptyState } from "@/components/common/empty-state";
import { getWorks } from "@/lib/data";
import { ACTIVE_CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "作品" };

export default async function WorksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  // UI上のカテゴリは映画+文学から(v1.1 判断10)。第二波はACTIVE_CATEGORIESに足すだけ
  const all = (await getWorks()).filter((w) => ACTIVE_CATEGORIES.includes(w.category));
  const works = category ? all.filter((w) => w.category === category) : all;
  const categories = ACTIVE_CATEGORIES.map(
    (key) => [key, CATEGORY_LABELS[key]] as const,
  );

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">作品</h1>
          <p className="mt-1 text-sm text-muted">レビューと記録が蓄積される、ZINEの書架。</p>
        </div>
        <Link href="/works/new">
          <Button>
            <Plus size={15} />
            作品を登録
          </Button>
        </Link>
      </div>

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
