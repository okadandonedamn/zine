import Link from "next/link";
import { Timeline } from "@/components/timeline/timeline";
import { TimelineTabs } from "@/components/timeline/timeline-tabs";
import { UserAvatar } from "@/components/common/user-avatar";
import { getCurrentUser, getTimeline, TIMELINE_TABS, type TimelineTab } from "@/lib/data";

export const metadata = { title: "ホーム" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active: TimelineTab = TIMELINE_TABS.some((t) => t.key === tab)
    ? (tab as TimelineTab)
    : "foryou";
  const [items, me] = await Promise.all([getTimeline(active), getCurrentUser()]);

  return (
    <div>
      <TimelineTabs active={active} />
      {/* 簡易コンポーザー(クリックで投稿画面へ) */}
      {me ? (
        <Link
          href="/post/new"
          className="hidden items-center gap-3 border-b border-line px-5 py-4 transition-colors hover:bg-surface/60 md:flex"
        >
          <UserAvatar user={me} link={false} />
          <span className="flex-1 text-sm text-subtle">いま、何を観ましたか?</span>
          <span className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg">
            投稿
          </span>
        </Link>
      ) : (
        <Link
          href="/login"
          className="hidden items-center justify-center gap-2 border-b border-line px-5 py-4 text-sm text-muted transition-colors hover:bg-surface/60 md:flex"
        >
          ログインして、タイムラインに参加する →
        </Link>
      )}
      <Timeline items={items} />
    </div>
  );
}
