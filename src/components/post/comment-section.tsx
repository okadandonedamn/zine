"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { createComment } from "@/lib/actions";
import { timeAgo } from "@/lib/utils";
import type { Comment, User } from "@/lib/types";

export function CommentSection({
  feedItemId,
  comments,
  me,
}: {
  feedItemId: string;
  comments: Comment[];
  me: User | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setMessage(null);
    const result = await createComment({ feedItemId, body });
    if (result.ok) {
      setBody("");
      setMessage(result.mock ? "コメントしました(モックモードのため保存されません)" : null);
      router.refresh();
    } else {
      setMessage(result.error);
    }
    setSending(false);
  }

  return (
    <section className="px-4 py-5 sm:px-5">
      <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
        コメント {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* コメント入力 */}
      {me ? (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-3">
          <UserAvatar user={me} size="sm" link={false} />
          <div className="flex-1">
            <Textarea
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="この活動にひとこと"
            />
            {message && <p className="mt-1 text-xs text-muted">{message}</p>}
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" disabled={!body.trim() || sending}>
                {sending ? "送信中…" : "コメントする"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            ログイン
          </Link>
          するとコメントできます。
        </p>
      )}

      {/* コメント一覧 */}
      {comments.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="まだコメントはありません"
            description="最初のひとことを残してみませんか。"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <UserAvatar user={c.user} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-xs">
                  <Link
                    href={`/profile/${c.user.username}`}
                    className="font-semibold text-foreground hover:underline"
                  >
                    {c.user.displayName}
                  </Link>
                  <span className="text-subtle">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
