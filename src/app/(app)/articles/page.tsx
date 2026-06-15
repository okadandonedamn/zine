import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineSurface } from "@/components/timeline/timeline-surface";

export const metadata = { title: "記事" };

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">記事</h1>
          <p className="mt-1 text-sm text-muted">長く書かれた考察と読みもの。</p>
        </div>
        <Link href="/article/new">
          <Button>
            <FileText size={15} />
            書く
          </Button>
        </Link>
      </div>
      <TimelineSurface
        searchParams={params}
        basePath="/articles"
        fixedTypes={["article"]}
        showTypeFilters={false}
      />
    </div>
  );
}
