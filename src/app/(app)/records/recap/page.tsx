import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { YearlyRecapCard } from "@/components/record/yearly-recap-card";
import { YearlyRecapChart } from "@/components/record/stats-charts";
import { getCurrentUser, getRecords, getWorks } from "@/lib/data";
import { buildYearlyRecap, latestRecordYear } from "@/lib/recap";
import { CATEGORY_COLORS, CATEGORY_LABELS, type WorkCategory } from "@/lib/types";
import { formatMinutes } from "@/lib/utils";

export const metadata = { title: "年間総括" };

export default async function RecordYearlyRecapPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ year: yearParam }, records, works, me] = await Promise.all([
    searchParams,
    getRecords(),
    getWorks(),
    getCurrentUser(),
  ]);
  const fallbackYear = latestRecordYear(records);
  const parsedYear = Number(yearParam);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
      ? parsedYear
      : fallbackYear;
  const recap = buildYearlyRecap(records, works, year);
  const workMap = new Map(works.map((work) => [work.id, work]));

  const categoryEntries = recap.categories.slice(0, 5);
  const categoryMax = categoryEntries[0]?.count ?? 1;
  const monthChart = recap.months.map((month) => ({
    label: `${month.month}月`,
    records: month.sessionCount,
    done: month.doneCount,
  }));
  const topMonth = [...recap.months].sort((a, b) => b.sessionCount - a.sessionCount)[0];
  const yearRecords = records.filter((record) => new Date(record.date).getFullYear() === year);
  const statusCounts = yearRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.status] = (acc[record.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusLabels: Record<string, string> = {
    want: "これから",
    doing: "途中",
    done: "完了",
    stacked: "積み",
    paused: "中断",
    rewatch: "再訪",
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.22em] text-subtle">YEARLY RECAP</p>
          <h1 className="mt-1 font-display text-2xl font-bold">年間総括</h1>
          <p className="mt-1 text-sm text-muted">
            {year}年の鑑賞記録を、作品・カテゴリ・感情・月別推移で振り返ります。
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/records/recap?year=${year - 1}`}
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            <ChevronLeft size={14} />
            {year - 1}
          </Link>
          <span className="text-subtle">/</span>
          <Link
            href={`/records/recap?year=${year + 1}`}
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            {year + 1}
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/records" className="text-accent hover:underline">
          記録タイムライン
        </Link>
        <Link href="/records/stats" className="text-accent hover:underline">
          統計
        </Link>
        <Link href="/records/new" className="text-accent hover:underline">
          記録する
        </Link>
      </div>

      {recap.sessionCount === 0 ? (
        <Card className="mt-6 p-6 text-center">
          <p className="font-display text-lg font-semibold">{year}年の記録はまだありません</p>
          <p className="mt-2 text-sm text-muted">
            記録が増えると、ここに年間総括と保存用カードが表示されます。
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "鑑賞時間", value: formatMinutes(recap.totalMinutes) },
              { label: "記録回数", value: `${recap.sessionCount}件` },
              { label: "完了作品", value: `${recap.doneWorks.length}作品` },
              { label: "活動月", value: `${recap.activeMonths}か月` },
              { label: "ラフ記録", value: `${recap.roughCount}件` },
              { label: "Expert記録", value: `${recap.expertCount}件` },
              { label: "読んだページ", value: `${recap.totalPages}p` },
              {
                label: "平均評価",
                value: recap.averageRating ? recap.averageRating.toFixed(1) : "-",
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <p className="font-display text-xl font-semibold">{stat.value}</p>
                <p className="mt-1 text-xs text-subtle">{stat.label}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">月別の記録</h2>
                  <p className="text-xs text-subtle">
                    最多: {topMonth.label} / {topMonth.sessionCount}件
                  </p>
                </div>
                <div className="mt-3">
                  <YearlyRecapChart data={monthChart} />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="font-display text-lg font-semibold">よく記録したカテゴリ</h2>
                <div className="mt-4 space-y-3">
                  {categoryEntries.map((entry) => (
                    <div key={entry.category} className="flex items-center gap-3 text-sm">
                      <span className="w-20 shrink-0 text-muted">
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${(entry.count / categoryMax) * 100}%`,
                            background: CATEGORY_COLORS[entry.category],
                          }}
                        />
                      </span>
                      <span className="w-8 text-right font-display">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <h2 className="font-display text-lg font-semibold">今年の作品</h2>
                  <ul className="mt-3 space-y-3">
                    {recap.doneWorks.slice(0, 6).map((work) => (
                      <li key={`${work.title}-${work.creator}`} className="text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate font-medium">{work.title}</span>
                          {work.rating != null && (
                            <span className="shrink-0 text-xs text-accent">
                              ★ {work.rating}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-subtle">
                          {work.creator} / {CATEGORY_LABELS[work.category]}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5">
                  <h2 className="font-display text-lg font-semibold">記録の内訳</h2>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <div key={status} className="border border-line p-3">
                        <p className="font-display text-lg font-semibold">
                          {statusCounts[status] ?? 0}
                        </p>
                        <p className="text-xs text-subtle">{label}</p>
                      </div>
                    ))}
                  </div>
                  {recap.topEmotion && (
                    <p className="mt-4 text-sm text-muted">
                      今年いちばん残った感情は
                      <span className="text-accent">「{recap.topEmotion}」</span>
                      でした。
                    </p>
                  )}
                </Card>
              </div>
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <YearlyRecapCard recap={recap} username={me?.username ?? "you"} />
            </div>
          </div>

          <Card className="mt-6 p-5">
            <h2 className="font-display text-lg font-semibold">来年につながる手がかり</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {categoryEntries.slice(0, 3).map((entry) => {
                const related = works
                  .filter((work) => work.category === (entry.category as WorkCategory))
                  .filter((work) => !yearRecords.some((record) => record.workId === work.id))
                  .slice(0, 2);
                return (
                  <div key={entry.category} className="border border-line p-3">
                    <p className="font-display text-sm font-semibold">{entry.label}</p>
                    <p className="mt-1 text-xs text-subtle">まだ記録していない候補</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {related.map((work) => (
                        <li key={work.id}>
                          <Link href={`/works/${work.id}`} className="hover:text-accent">
                            {work.title}
                          </Link>
                        </li>
                      ))}
                      {related.length === 0 && <li className="text-subtle">候補はありません</li>}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
