import Link from "next/link";
import { BarChart3, CalendarDays, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimelineSurface } from "@/components/timeline/timeline-surface";

export const metadata = { title: "鑑賞記録" };

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; tab?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">鑑賞記録</h1>
            <p className="mt-1 text-sm text-muted">
              公開された記録をタイムラインで追い、自分の記録は統計で振り返る。
            </p>
          </div>
          <Link href="/records/new">
            <Button>
              <Plus size={15} />
              記録
            </Button>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/records/calendar"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <CalendarDays size={14} />
            カレンダー
          </Link>
          <Link
            href="/records/stats"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <BarChart3 size={14} />
            統計
          </Link>
          <Link
            href="/records/recap"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <Trophy size={14} />
            年間総括
          </Link>
          <Link href="/goals" className="text-accent hover:underline">
            目標
          </Link>
        </div>
      </div>
      <TimelineSurface
        searchParams={params}
        basePath="/records"
        fixedTypes={["record"]}
        showTypeFilters={false}
      />
    </div>
  );
}
