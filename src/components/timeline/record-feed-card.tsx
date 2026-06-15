import { BookOpen, Clock, Disc3, MapPin, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeedCardShell } from "./feed-card-shell";
import { WorkChip } from "./work-chip";
import { statusFeedText, statusLabel } from "@/lib/record-status";
import { formatMinutes } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";

export function RecordFeedCard({ item }: { item: Extract<FeedItem, { type: "record" }> }) {
  const { record, work } = item;
  return (
    <FeedCardShell
      feedItemId={item.id}
      viewer={item.viewer}
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="RECORD"
      actionText={`「${work.title}」を${statusFeedText(work.category, record.status)}`}
      href={`/records/${record.id}`}
      counts={{ likes: 0, comments: 0 }}
    >
      <WorkChip work={work} />
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge>{record.mode === "rough" ? "ラフ" : "Expert"}</Badge>
        <Badge variant="accent">{statusLabel(work.category, record.status)}</Badge>
        {record.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatMinutes(record.durationMinutes)}
          </span>
        )}
        {record.pages && (
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {record.pages}ページ
          </span>
        )}
        {record.episodes && (
          <span className="flex items-center gap-1">
            <Tv size={12} />
            {record.episodes}話
          </span>
        )}
        {record.tracks && (
          <span className="flex items-center gap-1">
            <Disc3 size={12} />
            {record.tracks}曲
          </span>
        )}
        {record.place && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {record.place}
          </span>
        )}
        {record.focusScore != null && <Badge>集中 {record.focusScore}</Badge>}
        {record.satisfactionScore != null && <Badge>満足 {record.satisfactionScore}</Badge>}
        {record.emotionTags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      {record.memo && (
        <p className="mt-2 border-l-2 border-line pl-3 text-sm leading-6 text-muted">
          {record.memo}
        </p>
      )}
    </FeedCardShell>
  );
}
