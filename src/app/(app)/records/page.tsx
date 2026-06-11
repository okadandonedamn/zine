import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkChip } from "@/components/timeline/work-chip";
import { EmptyState } from "@/components/common/empty-state";
import { getRecords, getWorks } from "@/lib/data";
import { statusLabel } from "@/lib/record-status";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "鑑賞記録" };

export default async function RecordsPage() {
  const [allRecords, works] = await Promise.all([getRecords(), getWorks()]);
  const workMap = new Map(works.map((w) => [w.id, w]));
  const records = [...allRecords].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">鑑賞記録</h1>
          <p className="mt-1 text-sm text-muted">あなたの文化的生活の日記。</p>
        </div>
        <Link href="/records/new">
          <Button>
            <Plus size={15} />
            記録する
          </Button>
        </Link>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <Link href="/records/calendar" className="text-accent hover:underline">
          カレンダー
        </Link>
        <span className="text-subtle">/</span>
        <Link href="/records/stats" className="text-accent hover:underline">
          統計
        </Link>
        <span className="text-subtle">/</span>
        <Link href="/goals" className="text-accent hover:underline">
          目標
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだ記録がありません"
            description="観たもの、読んだもの、聴いたものを記録していきましょう。"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {records.map((r) => {
            const work = workMap.get(r.workId);
            if (!work) return null;
            return (
              <div key={r.id} className="rounded-lg border border-line bg-surface p-3">
                <WorkChip work={work} />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge variant="accent">{statusLabel(work.category, r.status)}</Badge>
                  <span>{timeAgo(r.date)}</span>
                  {r.visibility === "private" && <Badge>非公開</Badge>}
                  {r.emotionTags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                {r.memo && (
                  <p className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">{r.memo}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
