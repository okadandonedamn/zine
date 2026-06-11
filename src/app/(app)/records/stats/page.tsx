import { format, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { DailyMinutesChart } from "@/components/record/stats-charts";
import { GoalCard } from "@/components/record/goal-card";
import { getGoals, getRecords, getStreak, getWorks } from "@/lib/data";
import { formatMinutes } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_LABELS, type WorkCategory } from "@/lib/types";

export const metadata = { title: "鑑賞統計" };

export default async function RecordStatsPage() {
  const [records, works, goals, streak] = await Promise.all([
    getRecords(),
    getWorks(),
    getGoals(),
    getStreak(),
  ]);
  const workMap = new Map(works.map((w) => [w.id, w]));

  // 基準日 = 最新の記録日。記録がなければ今日
  const latest =
    records.map((r) => new Date(r.date)).sort((a, b) => +b - +a)[0] ?? new Date();

  // 直近14日の日別鑑賞時間
  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(latest, 13 - i);
    const key = format(day, "yyyy-MM-dd");
    const minutes = records
      .filter((r) => format(new Date(r.date), "yyyy-MM-dd") === key)
      .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
    return { day: format(day, "M/d"), minutes };
  });

  const totalMinutes = records.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
  const totalPages = records.reduce((s, r) => s + (r.pages ?? 0), 0);
  const doneCount = records.filter((r) => r.status === "done").length;

  // カテゴリ別件数
  const byCategory = records.reduce<Partial<Record<WorkCategory, number>>>((acc, r) => {
    const c = workMap.get(r.workId)?.category;
    if (c) acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const categoryEntries = (Object.entries(byCategory) as [WorkCategory, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const categoryMax = categoryEntries[0]?.[1] ?? 1;

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">鑑賞統計</h1>
      <p className="mt-1 text-sm text-muted">数字で振り返る、あなたの文化的生活。</p>

      {/* サマリー */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "総鑑賞時間", value: formatMinutes(totalMinutes) },
          { label: "完了した作品", value: `${doneCount}件` },
          { label: "読んだページ", value: `${totalPages}p` },
          { label: "連続記録", value: `${streak}日` },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="font-display text-xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-subtle">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* 日別グラフ */}
      <Card className="mt-4 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          日別鑑賞時間(直近14日)
        </h2>
        <div className="mt-3">
          <DailyMinutesChart data={daily} />
        </div>
      </Card>

      {/* カテゴリ別 */}
      <Card className="mt-4 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          カテゴリ別の記録数
        </h2>
        <div className="mt-4 space-y-3">
          {categoryEntries.map(([c, count]) => (
            <div key={c} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-muted">{CATEGORY_LABELS[c]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(count / categoryMax) * 100}%`,
                    background: CATEGORY_COLORS[c],
                  }}
                />
              </span>
              <span className="w-8 text-right font-display">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 目標 */}
      <h2 className="mt-8 font-display text-lg font-semibold">目標の進捗</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>
    </div>
  );
}
