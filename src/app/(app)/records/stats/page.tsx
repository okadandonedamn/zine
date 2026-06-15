import Link from "next/link";
import { format, subDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { DailyMinutesChart, ExpertMetricsTrendChart } from "@/components/record/stats-charts";
import { GoalCard } from "@/components/record/goal-card";
import { RecapCard } from "@/components/record/recap-card";
import { getCurrentUser, getGoals, getRecords, getStreak, getWorks } from "@/lib/data";
import { buildMonthlyRecap, latestRecordMonth } from "@/lib/recap";
import { formatMinutes } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_LABELS, type WorkCategory } from "@/lib/types";

export const metadata = { title: "鑑賞統計" };

export default async function RecordStatsPage() {
  const [records, works, goals, streak, me] = await Promise.all([
    getRecords(),
    getWorks(),
    getGoals(),
    getStreak(),
    getCurrentUser(),
  ]);
  const workMap = new Map(works.map((w) => [w.id, w]));
  const { year, month } = latestRecordMonth(records);
  const recap = buildMonthlyRecap(records, works, year, month);

  const latest =
    records.map((r) => new Date(r.date)).sort((a, b) => +b - +a)[0] ?? new Date();

  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = subDays(latest, 13 - i);
    const key = format(day, "yyyy-MM-dd");
    const minutes = records
      .filter((r) => format(new Date(r.date), "yyyy-MM-dd") === key)
      .reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
    return { day: format(day, "M/d"), minutes };
  });

  const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0);
  const totalPages = records.reduce((sum, r) => sum + (r.pages ?? 0), 0);
  const doneCount = records.filter((r) => r.status === "done").length;
  const roughCount = records.filter((r) => (r.mode ?? "expert") === "rough").length;
  const expertCount = records.length - roughCount;

  const byCategory = records.reduce<Partial<Record<WorkCategory, number>>>((acc, r) => {
    const category = workMap.get(r.workId)?.category;
    if (category) acc[category] = (acc[category] ?? 0) + 1;
    return acc;
  }, {});
  const categoryEntries = (Object.entries(byCategory) as [WorkCategory, number][]).sort(
    (a, b) => b[1] - a[1],
  );
  const categoryMax = categoryEntries[0]?.[1] ?? 1;

  const expertTrend = records
    .filter(
      (record) =>
        record.focusScore != null ||
        record.satisfactionScore != null ||
        record.revisitScore != null,
    )
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
    .map((record) => ({
      day: format(new Date(record.date), "M/d"),
      focus: record.focusScore,
      satisfaction: record.satisfactionScore,
      revisit: record.revisitScore,
    }));

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">鑑賞統計</h1>
      <p className="mt-1 text-sm text-muted">ラフな記録も、濃い記録も同じ生活ログとして集計します。</p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <Link href="/records/recap" className="text-accent hover:underline">
          年間総括を見る
        </Link>
        <Link href="/records" className="text-accent hover:underline">
          記録タイムラインへ
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "総鑑賞時間", value: formatMinutes(totalMinutes) },
          { label: "完了した作品", value: `${doneCount}件` },
          { label: "読んだページ", value: `${totalPages}p` },
          { label: "連続記録", value: `${streak}日` },
          { label: "ラフ記録", value: `${roughCount}件` },
          { label: "Expert記録", value: `${expertCount}件` },
          { label: "全記録", value: `${records.length}件` },
          { label: "今月の記録", value: `${recap.sessionCount}件` },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="font-display text-xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-subtle">{stat.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          日別鑑賞時間
        </h2>
        <div className="mt-3">
          <DailyMinutesChart data={daily} />
        </div>
      </Card>

      {expertTrend.length > 0 && (
        <Card className="mt-4 p-5">
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            Expert数値の推移
          </h2>
          <div className="mt-3">
            <ExpertMetricsTrendChart data={expertTrend} />
          </div>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          カテゴリ別の記録数
        </h2>
        <div className="mt-4 space-y-3">
          {categoryEntries.map(([category, count]) => (
            <div key={category} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-muted">{CATEGORY_LABELS[category]}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(count / categoryMax) * 100}%`,
                    background: CATEGORY_COLORS[category],
                  }}
                />
              </span>
              <span className="w-8 text-right font-display">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      {recap.sessionCount > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">月間総括</h2>
          <p className="mt-1 text-sm text-muted">
            {recap.year}年{recap.month}月の記録から生成しています。
          </p>
          <div className="mt-4">
            <RecapCard recap={recap} username={me?.username ?? "you"} />
          </div>
        </section>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold">目標の進捗</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
}
