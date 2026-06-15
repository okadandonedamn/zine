import Link from "next/link";
import { UserAvatar } from "@/components/common/user-avatar";
import { FeedCardShell } from "./feed-card-shell";
import type { FeedItem } from "@/lib/types";

export function QuoteCard({ item }: { item: Extract<FeedItem, { type: "quote" }> }) {
  const { post, quoted } = item;
  const quotedContent = (
    <blockquote className="mt-3 rounded-md border border-line bg-background/60 p-3 transition-colors">
      <div className="flex items-center gap-2">
        {quoted.typeLabel && (
          <span className="border-l-2 border-accent pl-1.5 text-[10px] tracking-widest text-subtle">
            {quoted.typeLabel}
          </span>
        )}
        <UserAvatar user={quoted.user} size="sm" link={false} />
        <span className="truncate text-xs font-semibold">{quoted.user.displayName}</span>
        {quoted.workTitle && (
          <span className="truncate text-xs text-subtle">『{quoted.workTitle}』について</span>
        )}
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{quoted.body}</p>
    </blockquote>
  );

  return (
    <FeedCardShell
      feedItemId={item.id}
      viewer={item.viewer}
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="QUOTE"
      counts={{
        likes: post.likes,
        comments: post.comments,
        reposts: post.reposts,
        bookmarks: post.bookmarks,
      }}
    >
      <p className="whitespace-pre-wrap text-[15px] leading-7">{post.body}</p>
      {quoted.href && !quoted.deleted ? (
        <Link href={quoted.href} className="block hover:[&_blockquote]:border-subtle">
          {quotedContent}
        </Link>
      ) : (
        quotedContent
      )}
    </FeedCardShell>
  );
}
