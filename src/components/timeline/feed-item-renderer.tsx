import { ArticleFeedCard } from "./article-feed-card";
import { PostCard } from "./post-card";
import { QuoteCard } from "./quote-card";
import { RecordFeedCard } from "./record-feed-card";
import { ReviewFeedCard } from "./review-feed-card";
import { ThreadFeedCard } from "./thread-feed-card";
import type { FeedItem } from "@/lib/types";

/**
 * Timeline First の核。
 * feed_items の type を見てカードを出し分ける。
 * 新しい活動タイプを追加するときは、型・カード・この分岐に1つ足すだけ。
 */
export function FeedItemRenderer({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "post":
      return <PostCard item={item} />;
    case "quote":
      return <QuoteCard item={item} />;
    case "review":
      return <ReviewFeedCard item={item} />;
    case "record":
      return <RecordFeedCard item={item} />;
    case "article":
      return <ArticleFeedCard item={item} />;
    case "thread":
      return <ThreadFeedCard item={item} />;
  }
}
