import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import type { Zine } from "@/lib/types";

export function ZineCard({ zine }: { zine: Zine }) {
  return (
    <Link
      href={`/zines/${zine.id}`}
      className="group block rounded-lg border border-line bg-surface p-4 transition-colors hover:border-subtle"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-display text-base font-semibold group-hover:text-accent">
          {zine.title}
        </h3>
        {zine.isPrivate && <Lock size={14} className="mt-1 shrink-0 text-subtle" />}
      </div>
      {zine.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{zine.description}</p>
      )}
      <p className="mt-3 flex items-center gap-1 text-[11px] text-subtle">
        <BookOpen size={12} />
        {zine.itemCount}篇
        {zine.owner && <span className="ml-2">by {zine.owner.displayName}</span>}
      </p>
    </Link>
  );
}
