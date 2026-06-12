import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { UserAvatar } from "@/components/common/user-avatar";
import { RatingStars } from "@/components/review/rating-stars";
import {
  DeleteCollectionButton,
  RemoveItemButton,
} from "@/components/collection/collection-controls";
import { getCollection, getCurrentUser } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getCollection(id);
  if (!collection) return { title: "コレクション" };
  return {
    title: collection.title,
    description: collection.description.slice(0, 120),
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [collection, me] = await Promise.all([getCollection(id), getCurrentUser()]);
  if (!collection) notFound();
  const isOwner = me != null && collection.owner?.id === me.id;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{collection.title}</h1>
            {collection.isPrivate && (
              <Badge variant="outline">
                <Lock size={11} className="mr-1" />
                非公開
              </Badge>
            )}
          </div>
          {collection.description && (
            <p className="mt-2 text-sm leading-7 text-muted">{collection.description}</p>
          )}
          {collection.owner && (
            <Link
              href={`/profile/${collection.owner.username}`}
              className="mt-3 flex w-fit items-center gap-2 text-xs text-subtle hover:text-foreground"
            >
              <UserAvatar user={collection.owner} size="sm" link={false} />
              {collection.owner.displayName} が編んだ {collection.itemCount}作品
            </Link>
          )}
        </div>
        {isOwner && <DeleteCollectionButton collectionId={collection.id} />}
      </div>

      {collection.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだ作品が入っていません"
            description="各作品ページの「コレクションに加える」から追加できます。"
            action={
              <Link href="/works" className="text-sm text-accent hover:underline">
                作品を探す →
              </Link>
            }
          />
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {collection.items.map((item, i) => (
            <li
              key={item.work.id}
              className="flex gap-4 rounded-lg border border-line bg-surface p-4"
            >
              <span className="w-8 shrink-0 pt-0.5 font-display text-lg font-semibold text-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <Link
                    href={`/works/${item.work.id}`}
                    className="truncate font-display text-base font-semibold hover:text-accent"
                  >
                    {item.work.title}
                  </Link>
                  <span className="shrink-0 text-xs text-subtle">
                    {CATEGORY_LABELS[item.work.category]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-subtle">
                  {item.work.creator} ・ {item.work.year}
                </p>
                {item.note && (
                  <p className="mt-2 border-l-2 border-line pl-3 text-sm leading-6 text-muted">
                    {item.note}
                  </p>
                )}
                <div className="mt-2">
                  <RatingStars rating={item.work.avgRating} size={11} />
                </div>
              </div>
              {isOwner && (
                <RemoveItemButton collectionId={collection.id} workId={item.work.id} />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
