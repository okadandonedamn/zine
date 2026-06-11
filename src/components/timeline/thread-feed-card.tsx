import { MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FeedCardShell } from "./feed-card-shell";
import { timeAgo } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";

export function ThreadFeedCard({ item }: { item: Extract<FeedItem, { type: "thread" }> }) {
  const { thread, board } = item;
  return (
    <FeedCardShell
      user={item.user}
      createdAt={item.createdAt}
      typeLabel="THREAD"
      actionText={`${board.name}にスレッドを立てました`}
      href={`/threads/${thread.id}`}
      counts={{ likes: 0, comments: thread.replyCount }}
    >
      <div className="rounded-md border border-line bg-background/60 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{board.name}</Badge>
          {thread.anonymous && <Badge>匿名スレ</Badge>}
        </div>
        <h3 className="mt-2 font-display text-base font-semibold leading-snug">
          {thread.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">{thread.body}</p>
        <p className="mt-2.5 flex items-center gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <MessagesSquare size={12} />
            {thread.replyCount}レス
          </span>
          <span>最終レス {timeAgo(thread.lastReplyAt)}</span>
        </p>
      </div>
    </FeedCardShell>
  );
}
