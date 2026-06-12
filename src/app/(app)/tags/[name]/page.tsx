import Link from "next/link";
import { Timeline } from "@/components/timeline/timeline";
import { EmptyState } from "@/components/common/empty-state";
import { FollowTagButton } from "@/components/tag/follow-tag-button";
import { getCurrentUser, getFeedByTag, isFollowingTag } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const tag = decodeURIComponent(name);
  return {
    title: `#${tag}`,
    description: `「${tag}」のタグが付いた投稿・レビュー・記事。`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const tag = decodeURIComponent(name);
  const [items, following, me] = await Promise.all([
    getFeedByTag(tag),
    isFollowingTag(tag),
    getCurrentUser(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-6 sm:px-6">
        <div>
          <h1 className="font-display text-2xl font-bold">#{tag}</h1>
          <p className="mt-1 text-sm text-muted">
            {items.length}件の活動 ・{" "}
            <Link
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="text-accent hover:underline"
            >
              作品からも探す →
            </Link>
          </p>
        </div>
        {me && <FollowTagButton name={tag} initialFollowing={following} />}
      </div>

      {items.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={`#${tag} の投稿はまだありません`}
            description="このタグを付けて、最初の一筆を残しませんか。"
          />
        </div>
      ) : (
        <Timeline items={items} />
      )}
    </div>
  );
}
