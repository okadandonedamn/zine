import { notFound } from "next/navigation";
import { FeedItemRenderer } from "@/components/timeline/feed-item-renderer";
import { CommentSection } from "@/components/post/comment-section";
import { DeletePostButton } from "@/components/post/delete-post-button";
import { getCommentsForFeedItem, getCurrentUser, getFeedItem } from "@/lib/data";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFeedItem(id);
  if (!item) notFound();
  const [comments, me] = await Promise.all([
    getCommentsForFeedItem(id),
    getCurrentUser(),
  ]);

  const isOwnPost =
    me?.id === item.user.id && (item.type === "post" || item.type === "quote");

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
        <h1 className="font-display text-lg font-semibold">投稿</h1>
        {isOwnPost && <DeletePostButton feedItemId={id} />}
      </div>
      <FeedItemRenderer item={item} />
      <CommentSection feedItemId={id} comments={comments} me={me} />
    </div>
  );
}
