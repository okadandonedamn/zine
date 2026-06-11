import { EmptyState } from "@/components/common/empty-state";
import { FeedItemRenderer } from "./feed-item-renderer";
import type { FeedItem } from "@/lib/types";

export function Timeline({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="まだ何も流れていません"
          description="作品を記録するか、最初のひとことを投稿してみてください。"
        />
      </div>
    );
  }
  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className="feed-enter">
          <FeedItemRenderer item={item} />
        </div>
      ))}
    </div>
  );
}
