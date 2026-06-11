import Link from "next/link";
import { CATEGORY_LABELS, type Work } from "@/lib/types";

/** レビュー・記録カード内に置く、作品への小さな参照 */
export function WorkChip({ work }: { work: Work }) {
  return (
    <Link
      href={`/works/${work.id}`}
      className="group flex items-center gap-3 rounded-md border border-line bg-background/60 p-2"
    >
      <span
        className="h-14 w-10 shrink-0 rounded-sm"
        style={{ background: `linear-gradient(160deg, ${work.coverFrom}, ${work.coverTo})` }}
      />
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-semibold group-hover:text-accent">
          {work.title}
        </span>
        <span className="block text-xs text-subtle">
          {CATEGORY_LABELS[work.category]} ・ {work.creator} ・ {work.year}
        </span>
      </span>
    </Link>
  );
}
