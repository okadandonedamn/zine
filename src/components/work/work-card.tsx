import Link from "next/link";
import { RatingStars } from "@/components/review/rating-stars";
import { CATEGORY_LABELS, type Work } from "@/lib/types";

export function WorkCard({ work }: { work: Work }) {
  return (
    <Link
      href={`/works/${work.id}`}
      className="group overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-subtle"
    >
      <div
        className="flex h-36 items-end p-3"
        style={{ background: `linear-gradient(160deg, ${work.coverFrom}, ${work.coverTo})` }}
      >
        <span className="rounded-sm bg-black/40 px-2 py-0.5 text-[10px] tracking-widest text-white/90">
          {CATEGORY_LABELS[work.category]}
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate font-display text-sm font-semibold group-hover:text-accent">
          {work.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {work.creator} ・ {work.year}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <RatingStars rating={work.avgRating} size={11} />
          <span className="text-[10px] text-subtle">{work.reviewCount}件のレビュー</span>
        </div>
      </div>
    </Link>
  );
}
