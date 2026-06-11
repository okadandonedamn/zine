import { notFound } from "next/navigation";
import { AlertTriangle, Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/review/rating-stars";
import { RadarRatingChart } from "@/components/review/radar-rating-chart";
import { UserAvatar } from "@/components/common/user-avatar";
import { TagBadge } from "@/components/common/tag-badge";
import { WorkChip } from "@/components/timeline/work-chip";
import { getReview, getUsers, getWork } from "@/lib/data";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();
  const work = await getWork(review.workId);
  if (!work) notFound();

  const author = review.author ?? (await getUsers())[0];

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <UserAvatar user={author} />
        <div>
          <p className="text-sm font-semibold">{author.displayName}</p>
          <p className="text-xs text-subtle">@{author.username}</p>
        </div>
      </div>

      <div className="mt-5">
        <WorkChip work={work} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <RatingStars rating={review.rating} size={18} />
        {review.spoiler && (
          <span className="flex items-center gap-1 text-xs text-subtle">
            <AlertTriangle size={13} />
            ネタバレあり
          </span>
        )}
      </div>

      {/* 本文とグラフが並ぶ — 批評の型 */}
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
        <p className="prose-zine whitespace-pre-wrap">{review.body}</p>
        <Card className="h-fit p-4">
          <h2 className="text-center font-display text-xs tracking-widest text-subtle">
            {author.displayName}の批評軸
          </h2>
          <RadarRatingChart axes={review.axes} size="md" />
          <ul className="space-y-1 border-t border-line pt-2 text-xs text-muted">
            {review.axes.map((a) => (
              <li key={a.axis} className="flex justify-between">
                <span>{a.axis}</span>
                <span className="font-display">{a.score}/10</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-5 border-t border-line pt-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <Heart size={15} />
          {review.likes}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle size={15} />
          {review.comments}
        </span>
        <span className="ml-auto flex gap-2">
          {review.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </span>
      </div>
    </div>
  );
}
