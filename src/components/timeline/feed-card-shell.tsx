import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { UserAvatar } from "@/components/common/user-avatar";
import { timeAgo } from "@/lib/utils";
import type { User } from "@/lib/types";

/**
 * 全フィードカード共通の外殻。
 * ヘッダー(ユーザー+種別ラベル+時刻) / 本体 / アクションバー。
 * 種別ごとのデザイン差は children 側で出し、統一感はここで担保する。
 */
export function FeedCardShell({
  user,
  createdAt,
  typeLabel,
  href,
  actionText,
  children,
  counts,
}: {
  user: User;
  createdAt: string;
  typeLabel: string;
  /** カード全体のリンク先(詳細ページ) */
  href?: string;
  /** 「が記事を公開しました」のような行動文。省略可 */
  actionText?: string;
  children: React.ReactNode;
  counts?: { likes: number; comments: number; reposts?: number; bookmarks?: number };
}) {
  return (
    <article className="border-b border-line px-4 py-4 transition-colors hover:bg-surface/60 sm:px-5">
      <div className="flex gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/profile/${user.username}`}
              className="truncate text-sm font-semibold hover:underline"
            >
              {user.displayName}
            </Link>
            <span className="truncate text-xs text-subtle">@{user.username}</span>
            <span className="ml-auto shrink-0 text-xs text-subtle">{timeAgo(createdAt)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="border-l-2 border-accent pl-1.5 text-[10px] tracking-widest text-subtle">
              {typeLabel}
            </span>
            {actionText && <span className="text-xs text-muted">{actionText}</span>}
          </div>
          <div className="mt-2">
            {href ? (
              <Link href={href} className="block">
                {children}
              </Link>
            ) : (
              children
            )}
          </div>
          {counts && (
            <div className="mt-3 flex max-w-sm items-center justify-between text-subtle">
              <button
                aria-label={`コメント ${counts.comments}件`}
                className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-accent"
              >
                <MessageCircle size={15} aria-hidden />
                {counts.comments > 0 && counts.comments}
              </button>
              <button
                aria-label={`リポスト ${counts.reposts ?? 0}件`}
                className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-accent"
              >
                <Repeat2 size={16} aria-hidden />
                {(counts.reposts ?? 0) > 0 && counts.reposts}
              </button>
              <button
                aria-label={`いいね ${counts.likes}件`}
                className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-accent"
              >
                <Heart size={15} aria-hidden />
                {counts.likes > 0 && counts.likes}
              </button>
              <button
                aria-label="ブックマーク"
                className="flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-accent"
              >
                <Bookmark size={15} aria-hidden />
                {(counts.bookmarks ?? 0) > 0 && counts.bookmarks}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
