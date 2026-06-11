import { AlertTriangle } from "lucide-react";
import { RatingStars } from "@/components/review/rating-stars";
import { RadarRatingChart } from "@/components/review/radar-rating-chart";
import { TagBadge } from "@/components/common/tag-badge";
import { FeedCardShell } from "./feed-card-shell";
import { WorkChip } from "./work-chip";
import type { FeedItem } from "@/lib/types";

export function ReviewFeedCard({ item }: { item: Extract<FeedItem, { type: "review" }> }) {
  const { review, work } = item;
  return (
    <FeedCardShell
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="REVIEW"
      counts={{ likes: review.likes, comments: review.comments }}
    >
      <WorkChip work={work} />
      <div className="mt-3 flex items-center gap-3">
        <RatingStars rating={review.rating} />
        {review.spoiler && (
          <span className="flex items-center gap-1 text-xs text-subtle">
            <AlertTriangle size={12} />
            ネタバレあり
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-3">
        <p className="line-clamp-4 flex-1 text-sm leading-7 text-foreground/90">
          {review.body}
        </p>
        {/* 小さな五角形グラフ — ZINEの個性 */}
        <div className="w-32 shrink-0">
          <RadarRatingChart axes={review.axes} size="sm" />
        </div>
      </div>
      {review.tags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-2">
          {review.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </p>
      )}
    </FeedCardShell>
  );
}
