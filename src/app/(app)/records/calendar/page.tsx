import { Card } from "@/components/ui/card";
import { RecordCalendar } from "@/components/record/record-calendar";
import { getRecords, getStreak, getWorks } from "@/lib/data";
import { CATEGORY_COLORS, CATEGORY_LABELS, type WorkCategory } from "@/lib/types";

export const metadata = { title: "鑑賞カレンダー" };

export default async function RecordCalendarPage() {
  const [records, works, streak] = await Promise.all([
    getRecords(),
    getWorks(),
    getStreak(),
  ]);
  const workMap = new Map(works.map((w) => [w.id, w]));
  const workOf = (id: string) => workMap.get(id);
  // 最新の記録がある月を表示。記録がなければ今月
  const latest =
    records.map((r) => new Date(r.date)).sort((a, b) => +b - +a)[0] ?? new Date();

  const usedCategories = [
    ...new Set(
      records
        .map((r) => workOf(r.workId)?.category)
        .filter((c): c is WorkCategory => c !== undefined),
    ),
  ];

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">鑑賞カレンダー</h1>
      <p className="mt-1 text-sm text-muted">
        現在 <span className="font-display text-accent">{streak}日</span> 連続で記録しています。
      </p>

      <Card className="mt-6 p-5">
        <RecordCalendar records={records} workOf={workOf} month={latest} />
        <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-xs text-muted">
          {usedCategories.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: CATEGORY_COLORS[c] }}
              />
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
