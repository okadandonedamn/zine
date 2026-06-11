import Link from "next/link";
import { Bell } from "lucide-react";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { MarkReadButton } from "@/components/notification/mark-read-button";
import { getNotifications } from "@/lib/data";
import { cn, timeAgo } from "@/lib/utils";
import type { NotificationKind } from "@/lib/types";

export const metadata = { title: "通知" };

const KIND_TEXT: Record<NotificationKind, string> = {
  like: "があなたの活動にいいねしました",
  comment: "があなたの活動にコメントしました",
  follow: "があなたをフォローしました",
  repost: "があなたの活動をリポストしました",
  quote: "があなたの投稿を引用しました",
  reply: "があなたのスレッドにレスしました",
  goal: "目標を達成しました",
};

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">通知</h1>
        {unread > 0 && <MarkReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだ通知はありません"
            description="あなたの活動に反応があると、ここに届きます。"
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((n) => {
            const inner = (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md border border-line p-3 transition-colors",
                  n.read ? "bg-transparent" : "bg-surface",
                  n.feedItemId && "hover:border-subtle",
                )}
              >
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                {n.actor ? (
                  <UserAvatar user={n.actor} size="sm" link={false} />
                ) : (
                  <Bell size={18} className="text-subtle" />
                )}
                <span className="min-w-0 flex-1 text-sm">
                  {n.actor && <span className="font-semibold">{n.actor.displayName}</span>}
                  <span className="text-muted">{KIND_TEXT[n.kind]}</span>
                </span>
                <span className="shrink-0 text-xs text-subtle">{timeAgo(n.createdAt)}</span>
              </span>
            );
            return (
              <li key={n.id}>
                {n.feedItemId ? (
                  <Link href={`/posts/${n.feedItemId}`}>{inner}</Link>
                ) : n.actor ? (
                  <Link href={`/profile/${n.actor.username}`}>{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
