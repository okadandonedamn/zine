"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { toggleBookmark, toggleLike, toggleRepost } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ViewerState } from "@/lib/types";

type Kind = "like" | "repost" | "bookmark";

/**
 * フィードカード下部のアクションバー。
 * 楽観的更新: 先にUIを変えてからサーバーに送り、失敗したら戻す。
 */
export function FeedActions({
  feedItemId,
  counts,
  viewer,
  commentHref,
}: {
  feedItemId: string;
  counts: { likes: number; comments: number; reposts?: number; bookmarks?: number };
  viewer?: ViewerState;
  commentHref: string;
}) {
  const [state, setState] = useState({
    liked: viewer?.liked ?? false,
    reposted: viewer?.reposted ?? false,
    bookmarked: viewer?.bookmarked ?? false,
    likes: counts.likes,
    reposts: counts.reposts ?? 0,
    bookmarks: counts.bookmarks ?? 0,
  });
  const [error, setError] = useState<string | null>(null);

  async function toggle(kind: Kind) {
    setError(null);
    const prev = state;
    const next = { ...state };
    if (kind === "like") {
      next.liked = !state.liked;
      next.likes += next.liked ? 1 : -1;
    } else if (kind === "repost") {
      next.reposted = !state.reposted;
      next.reposts += next.reposted ? 1 : -1;
    } else {
      next.bookmarked = !state.bookmarked;
      next.bookmarks += next.bookmarked ? 1 : -1;
    }
    setState(next);
    const action =
      kind === "like" ? toggleLike : kind === "repost" ? toggleRepost : toggleBookmark;
    const result = await action(feedItemId);
    if (!result.ok) {
      setState(prev); // 失敗したら巻き戻す
      setError(result.error);
    }
  }

  const btn =
    "flex cursor-pointer items-center gap-1.5 text-xs transition-colors hover:text-accent";

  return (
    <div>
      <div className="mt-3 flex max-w-sm items-center justify-between text-subtle">
        <Link href={commentHref} aria-label={`コメント ${counts.comments}件`} className={btn}>
          <MessageCircle size={15} aria-hidden />
          {counts.comments > 0 && counts.comments}
        </Link>
        <button
          aria-label={state.reposted ? "リポストを取り消す" : "リポストする"}
          aria-pressed={state.reposted}
          onClick={() => toggle("repost")}
          className={cn(btn, state.reposted && "text-accent")}
        >
          <Repeat2 size={16} aria-hidden />
          {state.reposts > 0 && state.reposts}
        </button>
        <button
          aria-label={state.liked ? "いいねを取り消す" : "いいねする"}
          aria-pressed={state.liked}
          onClick={() => toggle("like")}
          className={cn(btn, state.liked && "text-accent")}
        >
          <Heart size={15} aria-hidden fill={state.liked ? "currentColor" : "none"} />
          {state.likes > 0 && state.likes}
        </button>
        <button
          aria-label={state.bookmarked ? "ブックマークを外す" : "ブックマークする"}
          aria-pressed={state.bookmarked}
          onClick={() => toggle("bookmark")}
          className={cn(btn, state.bookmarked && "text-accent")}
        >
          <Bookmark
            size={15}
            aria-hidden
            fill={state.bookmarked ? "currentColor" : "none"}
          />
          {state.bookmarks > 0 && state.bookmarks}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
    </div>
  );
}
