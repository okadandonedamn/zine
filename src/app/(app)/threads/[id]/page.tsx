import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import { ReplyComposer } from "@/components/board/reply-composer";
import { ReportButton } from "@/components/common/report-button";
import { WorkChip } from "@/components/timeline/work-chip";
import { getRepliesForThread, getThread, getWork } from "@/lib/data";
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
  const [replies, work] = await Promise.all([
    getRepliesForThread(id),
    getWork(thread.workId),
  ]);

  return (
    <div className="px-4 py-6 sm:px-6">
      {work && (
        <p className="text-xs text-subtle">
          <Link href={`/works/${work.id}`} className="hover:underline">
            『{work.title}』の語り場
          </Link>{" "}
          /
        </p>
      )}
      <h1 className="mt-2 font-display text-xl font-bold leading-relaxed">{thread.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-subtle">
          {thread.replyCount}レス ・ 最終 {timeAgo(thread.lastReplyAt)}
        </span>
        <span className="ml-auto">
          <ReportButton targetType="thread" targetId={thread.id} />
        </span>
      </div>

      {work && (
        <div className="mt-4">
          <WorkChip work={work} />
        </div>
      )}

      {/* レス一覧。レス番号と引用が積み重なる。削除済みも行は残る */}
      <div className="mt-6 space-y-3">
        {replies.map((r) =>
          r.deleted ? (
            <div
              key={r.id}
              id={`res-${r.number}`}
              className="rounded-md border border-dashed border-line p-4"
            >
              <div className="flex items-baseline gap-2 text-xs text-subtle">
                <span className="font-display font-semibold">{r.number}</span>
                <span>削除済み</span>
                <span className="ml-auto">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm italic text-subtle">
                このレスは削除されました。レス番号は保全されます。
              </p>
            </div>
          ) : (
            <div
              key={r.id}
              id={`res-${r.number}`}
              className="rounded-md border border-line bg-surface p-4"
            >
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
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-subtle">
                <button className="flex cursor-pointer items-center gap-1 transition-colors hover:text-accent">
                  <Heart size={13} />
                  {r.likes}
                </button>
                <ReportButton targetType="thread_reply" targetId={r.id} />
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-6">
        <ReplyComposer threadId={id} />
      </div>
    </div>
  );
}
