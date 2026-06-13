import Link from "next/link";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  getCurrentUser,
  getGoals,
  getStreak,
  getTrendingTags,
  getUsers,
  getWorks,
} from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/types";

export async function RightRail() {
  const [trends, allGoals, streak, allWorks, me, allUsers] = await Promise.all([
    getTrendingTags(),
    getGoals(),
    getStreak(),
    getWorks(),
    getCurrentUser(),
    getUsers(),
  ]);
  const goals = allGoals.slice(0, 2);
  const works = allWorks.slice(0, 3);
  const usersToFollow = allUsers.filter((u) => u.id !== me?.id).slice(0, 3);

  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 space-y-4 overflow-y-auto border-l border-line px-5 py-6 xl:block print:hidden">
      {/* トレンド */}
      <Card className="p-4">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          いま語られている
        </h2>
        <ul className="mt-3 space-y-2.5">
          {trends.map((t, i) => (
            <li key={t.tag}>
              <Link href={`/tags/${encodeURIComponent(t.tag)}`} className="group block">
                <span className="mr-2 font-display text-xs text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm group-hover:text-accent">#{t.tag}</span>
                <span className="ml-2 text-xs text-subtle">{t.count}件</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* 自分の記録 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            今週のあなた
          </h2>
          <span className="flex items-center gap-1 text-xs text-accent">
            <Flame size={13} />
            {streak}日連続
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {goals.map((g) => (
            <div key={g.id}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="text-muted">{g.title}</span>
                <span>
                  {g.current}
                  <span className="text-subtle">
                    /{g.target}
                    {g.unit}
                  </span>
                </span>
              </div>
              <Progress value={(g.current / g.target) * 100} />
            </div>
          ))}
        </div>
        <Link href="/records/stats" className="mt-3 block text-xs text-accent hover:underline">
          統計を見る →
        </Link>
      </Card>

      {/* 作品 */}
      <Card className="p-4">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          話題の作品
        </h2>
        <ul className="mt-3 space-y-3">
          {works.map((w) => (
            <li key={w.id}>
              <Link href={`/works/${w.id}`} className="group flex items-center gap-3">
                <span
                  className="h-12 w-9 shrink-0 rounded-sm"
                  style={{ background: `linear-gradient(160deg, ${w.coverFrom}, ${w.coverTo})` }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm group-hover:text-accent">
                    {w.title}
                  </span>
                  <span className="block text-xs text-subtle">
                    {CATEGORY_LABELS[w.category]} / {w.creator}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* おすすめユーザー */}
      <Card className="p-4">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          批評の隣人たち
        </h2>
        <ul className="mt-3 space-y-3">
          {usersToFollow.map((u) => (
            <li key={u.id} className="flex items-center gap-3">
              <UserAvatar user={u} size="sm" />
              <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
                <span className="block truncate text-sm hover:text-accent">{u.displayName}</span>
                <span className="block truncate text-xs text-subtle">@{u.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}
