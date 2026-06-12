import Link from "next/link";
import { Lock } from "lucide-react";

import type { Collection } from "@/lib/types";

export function CollectionCard({
  collection,
  showOwner = false,
}: {
  collection: Collection;
  showOwner?: boolean;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group block rounded-lg border border-line bg-surface p-4 transition-colors hover:border-subtle"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-display text-base font-semibold group-hover:text-accent">
          {collection.title}
        </h3>
        {collection.isPrivate && <Lock size={14} className="mt-1 shrink-0 text-subtle" />}
      </div>
      {collection.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
          {collection.description}
        </p>
      )}
      <p className="mt-3 text-[11px] text-subtle">
        {collection.itemCount}作品
        {showOwner && collection.owner && (
          <span className="ml-2">by {collection.owner.displayName}</span>
        )}
      </p>
    </Link>
  );
}
