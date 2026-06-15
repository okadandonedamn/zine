import Link from "next/link";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineSurface } from "@/components/timeline/timeline-surface";

export const metadata = { title: "短文投稿" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">短文投稿</h1>
          <p className="mt-1 text-sm text-muted">タイムラインに流れる短いメモと引用。</p>
        </div>
        <Link href="/post/new">
          <Button>
            <PenLine size={15} />
            投稿
          </Button>
        </Link>
      </div>
      <TimelineSurface
        searchParams={params}
        basePath="/posts"
        fixedTypes={["post"]}
        showTypeFilters={false}
      />
    </div>
  );
}
