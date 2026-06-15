import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { UserAvatar } from "@/components/common/user-avatar";
import { TagBadge } from "@/components/common/tag-badge";
import { FeedCardShell } from "./feed-card-shell";
import { WorkChip } from "./work-chip";
import type { FeedItem } from "@/lib/types";

function unwrapRepost(item: FeedItem): FeedItem {
  return item.type === "repost" ? unwrapRepost(item.reposted) : item;
}

function itemHref(item: FeedItem): string {
  if (item.type === "post" || item.type === "quote" || item.type === "repost") {
    return `/posts/${item.id}`;
  }
  if (item.type === "record") return `/records/${item.record.id}`;
  if (item.type === "article") return `/articles/${item.article.id}`;
  if (item.type === "thread") return `/threads/${item.thread.id}`;
  return `/posts/${item.id}`;
}

function itemLabel(item: FeedItem): string {
  if (item.type === "post") return "POST";
  if (item.type === "quote") return "QUOTE";
  if (item.type === "review") return "REVIEW";
  if (item.type === "record") return "RECORD";
  if (item.type === "article") return "ARTICLE";
  if (item.type === "thread") return "THREAD";
  return "REPOST";
}

function PreviewBody({ item }: { item: FeedItem }) {
  if (item.type === "post" || item.type === "quote") {
    return (
      <>
        <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
          {item.post.body}
        </p>
        {item.post.tags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {item.post.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </p>
        )}
      </>
    );
  }
  if (item.type === "review") {
    return (
      <>
        <WorkChip work={item.work} />
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/90">
          {item.review.body}
        </p>
      </>
    );
  }
  if (item.type === "record") {
    return (
      <>
        <WorkChip work={item.work} />
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/90">
          {item.record.memo ?? item.record.comment ?? "記録を公開しました。"}
        </p>
      </>
    );
  }
  if (item.type === "article") {
    return (
      <>
        <h3 className="font-display text-base font-semibold leading-snug">
          {item.article.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted">
          {item.article.excerpt}
        </p>
      </>
    );
  }
  if (item.type === "thread") {
    return (
      <>
        <WorkChip work={item.work} />
        <h3 className="mt-2 font-display text-base font-semibold leading-snug">
          {item.thread.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">
          {item.thread.body}
        </p>
      </>
    );
  }
  return null;
}

export function RepostFeedCard({ item }: { item: Extract<FeedItem, { type: "repost" }> }) {
  const reposted = unwrapRepost(item.reposted);
  return (
    <FeedCardShell
      feedItemId={item.id}
      viewer={item.viewer}
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="REPOST"
      actionText="元の活動をリポストしました"
    >
      <Link
        href={itemHref(reposted)}
        className="block rounded-md border border-line bg-background/60 p-3 transition-colors hover:border-subtle"
      >
        <div className="flex items-center gap-2">
          <Repeat2 size={13} className="text-subtle" aria-hidden />
          <span className="border-l-2 border-accent pl-1.5 text-[10px] tracking-widest text-subtle">
            {itemLabel(reposted)}
          </span>
          <UserAvatar user={reposted.user} size="sm" link={false} />
          <span className="truncate text-xs font-semibold">
            {reposted.user.displayName}
          </span>
          <span className="truncate text-xs text-subtle">@{reposted.user.username}</span>
        </div>
        <div className="mt-2">
          <PreviewBody item={reposted} />
        </div>
      </Link>
    </FeedCardShell>
  );
}
