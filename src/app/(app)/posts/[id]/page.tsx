import { notFound } from "next/navigation";
import { FeedItemRenderer } from "@/components/timeline/feed-item-renderer";
import { EmptyState } from "@/components/common/empty-state";
import { getFeedItem } from "@/lib/data";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getFeedItem(id);
  if (!item) notFound();

  return (
    <div>
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h1 className="font-display text-lg font-semibold">投稿</h1>
      </div>
      <FeedItemRenderer item={item} />
      <div className="p-5">
        <EmptyState
          title="まだコメントはありません"
          description="最初の返信を書いてみませんか。(コメント機能はPhase 7で保存に対応します)"
        />
      </div>
    </div>
  );
}
