import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReplyComposer } from "@/components/board/reply-composer";
import { WorkChip } from "@/components/timeline/work-chip";
import { getBoard, getRepliesForThread, getThread, getWork } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) return { title: "スレッド" };
  return { title: thread.title, description: thread.body.slice(0, 120) };
}

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const thread = await getThread(id);
  if (!thread) notFound();
  const [board, replies, work] = await Promise.all([
    getBoard(thread.boardId),
    getRepliesForThread(id),
    thread.workId ? getWork(thread.workId) : Promise.resolve(undefined),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6">
      <p className="text-xs text-subtle">
        <Link href="/boards" className="hover:underline">
          掲示板
        </Link>{" "}
        /{" "}
        {board && (
          <Link href={`/boards/${board.id}`} className="hover:underline">
            {board.name}
          </Link>
        )}
      </p>
      <h1 className="mt-2 font-display text-xl font-bold leading-relaxed">{thread.title}</h1>
      <div className="mt-2 flex items-center gap-2">
        {thread.anonymous && <Badge>匿名スレ</Badge>}
        <span className="text-xs text-subtle">
          {thread.replyCount}レス ・ 最終 {timeAgo(thread.lastReplyAt)}
        </span>
      </div>

      {work && (
        <div className="mt-4">
          <WorkChip work={work} />
        </div>
      )}

      {/* レス一覧。レス番号と引用が積み重なる */}
      <div className="mt-6 space-y-3">
        {replies.map((r) => (
          <div key={r.id} id={`res-${r.number}`} className="rounded-md border border-line bg-surface p-4">
            <div className="flex items-baseline gap-2 text-xs">
              <span className="font-display font-semibold text-accent">{r.number}</span>
              <span className="font-medium">{r.name}</span>
              <span className="ml-auto text-subtle">{timeAgo(r.createdAt)}</span>
            </div>
            {r.quoteNumber && (
              <a
                href={`#res-${r.quoteNumber}`}
                className="mt-2 block border-l-2 border-accent/50 pl-2 text-xs text-subtle hover:text-accent"
              >
                &gt;&gt;{r.quoteNumber} への返信
              </a>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{r.body}</p>
            <div className="mt-2.5 flex items-center gap-4 text-xs text-subtle">
              <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-accent">
                <Heart size={13} />
                {r.likes}
              </button>
              <button
                className="flex cursor-pointer items-center gap-1 transition-colors hover:text-accent"
                title="通報(モデレーターが確認します)"
              >
                <Flag size={12} />
                通報
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <ReplyComposer threadId={id} />
      </div>
    </div>
  );
}
