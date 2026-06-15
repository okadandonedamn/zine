"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleThreadReplyLike } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function ReplyLikeButton({
  replyId,
  initialLiked,
  initialCount,
}: {
  replyId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setError(null);
    setPending(true);
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount(Math.max(0, count + (nextLiked ? 1 : -1)));

    const result = await toggleThreadReplyLike(replyId);
    if (!result.ok) {
      setLiked(prevLiked);
      setCount(prevCount);
      setError(result.error);
    }
    setPending(false);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={liked ? "レスのいいねを取り消す" : "レスにいいね"}
        aria-pressed={liked}
        disabled={pending}
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer items-center gap-1 transition-colors hover:text-accent disabled:cursor-wait disabled:opacity-70",
          liked && "text-accent",
        )}
      >
        <Heart size={13} aria-hidden fill={liked ? "currentColor" : "none"} />
        {count}
      </button>
      {error && <span className="text-[11px] text-accent">{error}</span>}
    </span>
  );
}
