import { TagBadge } from "@/components/common/tag-badge";
import { FeedCardShell } from "./feed-card-shell";
import type { FeedItem } from "@/lib/types";

export function PostCard({ item }: { item: Extract<FeedItem, { type: "post" }> }) {
  const { post } = item;
  return (
    <FeedCardShell
      feedItemId={item.id}
      viewer={item.viewer}
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="POST"
      counts={{
        likes: post.likes,
        comments: post.comments,
        reposts: post.reposts,
        bookmarks: post.bookmarks,
      }}
    >
      <p className="whitespace-pre-wrap text-[15px] leading-7">{post.body}</p>
      {post.tags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </p>
      )}
    </FeedCardShell>
  );
}
