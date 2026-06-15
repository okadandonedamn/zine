import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineSurface } from "@/components/timeline/timeline-surface";

export const metadata = { title: "レビュー" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">レビュー</h1>
          <p className="mt-1 text-sm text-muted">作品への評価と読み応えのある感想。</p>
        </div>
        <Link href="/reviews/new">
          <Button>
            <Star size={15} />
            レビュー
          </Button>
        </Link>
      </div>
      <TimelineSurface
        searchParams={params}
        basePath="/reviews"
        fixedTypes={["review"]}
        showTypeFilters={false}
      />
    </div>
  );
}
