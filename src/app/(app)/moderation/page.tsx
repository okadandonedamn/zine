import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ReportActions } from "@/components/moderation/report-actions";
import { UserAvatar } from "@/components/common/user-avatar";
import { EmptyState } from "@/components/common/empty-state";
import { getCurrentUser, getReports } from "@/lib/data";
import { supabaseEnabled } from "@/lib/supabase/env";
import { timeAgo } from "@/lib/utils";
import type { Report, ReportStatus } from "@/lib/types";

export const metadata = { title: "モデレーション" };

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "未対応",
  reviewed: "確認済み",
  actioned: "削除対応",
  dismissed: "却下",
};

const TARGET_LABELS: Record<Report["targetType"], string> = {
  thread: "スレッド",
  thread_reply: "レス",
};

function ReportCard({ report }: { report: Report }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
        <UserAvatar user={report.reporter} size="sm" />
        <span className="font-medium text-foreground">
          {report.reporter.displayName}
        </span>
        <span>が{TARGET_LABELS[report.targetType]}を通報</span>
        <span className="ml-auto">{timeAgo(report.createdAt)}</span>
      </div>
      <p className="mt-2 text-sm leading-6">{report.reason}</p>
      <blockquote className="mt-2 border-l-2 border-line pl-3 text-xs leading-6 text-muted">
        {report.excerpt}
      </blockquote>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {report.status === "open" ? (
          <ReportActions reportId={report.id} />
        ) : (
          <span className="text-xs text-subtle">{STATUS_LABELS[report.status]}</span>
        )}
        <Link
          href={report.targetHref}
          className="ml-auto flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLink size={12} />
          対象を見る
        </Link>
      </div>
    </div>
  );
}

/**
 * 通報処理画面の最小版(Phase 6)。moderator / admin のみ到達できる。
 * role の付与はDBダッシュボードから行う(アプリにUIを作らない)。
 */
export default async function ModerationPage() {
  const me = await getCurrentUser();
  if (!me || (me.role !== "moderator" && me.role !== "admin")) notFound();
  const reports = await getReports();
  const open = reports.filter((r) => r.status === "open");
  const handled = reports.filter((r) => r.status !== "open");

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-xl font-bold">モデレーション</h1>
      <p className="mt-1 text-sm text-muted">
        通報されたコンテンツを確認し、削除(論理削除)または却下します。
      </p>
      {!supabaseEnabled && (
        <p className="mt-2 text-xs text-subtle">
          モックモードのため処理結果は保存されません(画面確認用)。
        </p>
      )}

      <h2 className="mt-6 text-sm font-semibold">未対応({open.length})</h2>
      <div className="mt-3 space-y-3">
        {open.length === 0 ? (
          <EmptyState
            title="未対応の通報はありません"
            description="新しい通報が届くとここに表示されます。"
          />
        ) : (
          open.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </div>

      {handled.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-muted">
            処理済み({handled.length})
          </h2>
          <div className="mt-3 space-y-3 opacity-70">
            {handled.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
