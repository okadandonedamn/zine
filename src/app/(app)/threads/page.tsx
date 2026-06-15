import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineSurface } from "@/components/timeline/timeline-surface";

export const metadata = { title: "語り場" };

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">語り場</h1>
          <p className="mt-1 text-sm text-muted">作品ごとに続いていくスレッド。</p>
        </div>
        <Link href="/threads/new">
          <Button>
            <MessagesSquare size={15} />
            立てる
          </Button>
        </Link>
      </div>
      <TimelineSurface
        searchParams={params}
        basePath="/threads"
        fixedTypes={["thread"]}
        showTypeFilters={false}
      />
    </div>
  );
}
