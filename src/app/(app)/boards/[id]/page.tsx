import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { getBoard, getThreadsForBoard } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoard(id);
  if (!board) notFound();
  const threads = await getThreadsForBoard(id);

  return (
    <div className="px-4 py-6 sm:px-6">
      <p className="text-xs text-subtle">
        <Link href="/boards" className="hover:underline">
          掲示板
        </Link>{" "}
        /
      </p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{board.name}</h1>
        <Link href="/threads/new">
          <Button size="sm">
            <Plus size={14} />
            スレ立て
          </Button>
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">{board.description}</p>

      {threads.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="まだスレッドがありません"
            description="最初の話題を投げてみてください。"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/threads/${t.id}`}
              className="block rounded-md border border-line bg-surface p-4 transition-colors hover:border-subtle"
            >
              <div className="flex items-center gap-2">
                {t.anonymous && <Badge>匿名スレ</Badge>}
                <h2 className="font-display font-semibold leading-snug">{t.title}</h2>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-muted">{t.body}</p>
              <p className="mt-2 flex items-center gap-3 text-xs text-subtle">
                <span className="flex items-center gap-1">
                  <MessagesSquare size={12} />
                  {t.replyCount}
                </span>
                <span>最終レス {timeAgo(t.lastReplyAt)}</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
