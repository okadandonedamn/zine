import { notFound } from "next/navigation";
import { BookOpen, Clock, Disc3, MapPin, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/common/user-avatar";
import { WorkChip } from "@/components/timeline/work-chip";
import { RecordMetricsChart } from "@/components/record/stats-charts";
import { getRecord } from "@/lib/data";
import { statusLabel } from "@/lib/record-status";
import { formatMinutes, timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRecord(id);
  return { title: detail ? `${detail.work.title}の記録` : "記録" };
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getRecord(id);
  if (!detail) notFound();

  const { record, work, user } = detail;
  const metrics = [
    record.focusScore != null ? { label: "集中度", value: record.focusScore } : null,
    record.satisfactionScore != null ? { label: "満足度", value: record.satisfactionScore } : null,
    record.revisitScore != null ? { label: "再訪したさ", value: record.revisitScore } : null,
    ...(record.customMetrics ?? []),
  ].filter((item): item is { label: string; value: number } => Boolean(item));

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-start gap-3">
        {user && <UserAvatar user={user} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge>{record.mode === "rough" ? "ラフ記録" : "エキスパート記録"}</Badge>
            <Badge variant="accent">{statusLabel(work.category, record.status)}</Badge>
            <span>{timeAgo(record.date)}</span>
            {record.visibility === "private" && <Badge>非公開</Badge>}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">鑑賞記録</h1>
          <div className="mt-3">
            <WorkChip work={work} />
          </div>
        </div>
      </div>

      {record.imageUrls && record.imageUrls.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {record.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="aspect-video w-full rounded-md border border-line object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            ログ
          </h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            {record.durationMinutes != null && (
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                {formatMinutes(record.durationMinutes)}
              </span>
            )}
            {record.pages != null && (
              <span className="inline-flex items-center gap-1">
                <BookOpen size={14} />
                {record.pages}ページ
              </span>
            )}
            {record.episodes != null && (
              <span className="inline-flex items-center gap-1">
                <Tv size={14} />
                {record.episodes}話
              </span>
            )}
            {record.tracks != null && (
              <span className="inline-flex items-center gap-1">
                <Disc3 size={14} />
                {record.tracks}曲
              </span>
            )}
            {record.place && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} />
                {record.place}
              </span>
            )}
          </div>
          {record.emotionTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {record.emotionTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          {record.memo && (
            <p className="mt-4 border-l-2 border-line pl-3 text-sm leading-7 text-muted">
              {record.memo}
            </p>
          )}
        </Card>

        {metrics.length > 0 && (
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
              数値メモ
            </h2>
            <div className="mt-3">
              <RecordMetricsChart data={metrics} />
            </div>
          </Card>
        )}
      </div>

      {record.comment && (
        <section className="mt-6 border-t border-line pt-5">
          <h2 className="font-display text-lg font-semibold">コメント / ノート</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {record.comment}
          </p>
        </section>
      )}
    </div>
  );
}
