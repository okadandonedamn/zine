import { Clock } from "lucide-react";
import { TagBadge } from "@/components/common/tag-badge";
import { FeedCardShell } from "./feed-card-shell";
import type { FeedItem } from "@/lib/types";

export function ArticleFeedCard({ item }: { item: Extract<FeedItem, { type: "article" }> }) {
  const { article } = item;
  return (
    <FeedCardShell
      feedItemId={item.id}
      viewer={item.viewer}
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="ARTICLE"
      actionText="記事を公開しました"
      href={`/articles/${article.id}`}
      counts={{ likes: article.likes, comments: article.comments }}
      footer={
        article.tags.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
          </p>
        ) : undefined
      }
    >
      {/* 記事カードは「誌面」らしく。カバー帯+明朝のタイトル */}
      <div className="overflow-hidden rounded-md border border-line">
        <div
          className="h-2"
          style={{ background: `linear-gradient(90deg, ${article.coverFrom}, ${article.coverTo})` }}
        />
        <div className="bg-background/60 p-4">
          <h3 className="font-display text-lg font-semibold leading-snug">{article.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-7 text-muted">{article.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-subtle">
              <Clock size={12} />
              読了{article.readMinutes}分
            </span>
          </div>
        </div>
      </div>
    </FeedCardShell>
  );
}
